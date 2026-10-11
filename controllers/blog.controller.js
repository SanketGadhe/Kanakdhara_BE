const Blog = require("../models/Blog.model");
const BlogLike = require("../models/BlogLike.model");
const mongoose = require("mongoose");

const normalizeTagline = (tagline) => {
    if (typeof tagline !== "string" || !tagline.trim()) {
        return Blog.defaultTagline;
    }

    return tagline.trim();
};

const normalizeCategory = (category) => {
    if (typeof category !== "string") return category;
    const value = category.trim();
    return value.toLowerCase() === "mutual funds" ? "Financial Planning" : value;
};

const escapeHtml = (value) => String(value ?? "").replace(
    /[&<>"']/g,
    (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
    })[character],
);

const SITE_ORIGIN = (process.env.PUBLIC_SITE_URL || "https://kanakdharainv.com").replace(/\/$/, "");
const API_ORIGIN = (process.env.PUBLIC_API_URL || "https://api.kanakdharainv.com").replace(/\/$/, "");

const getAbsoluteBlogImageUrl = (image) => {
    const normalizedImage = normalizeImagePath(image);

    if (/^https?:\/\//i.test(normalizedImage || "")) return normalizedImage;
    if (typeof normalizedImage === "string" && normalizedImage.startsWith("//")) {
        return `https:${normalizedImage}`;
    }
    if (typeof normalizedImage === "string" && normalizedImage.startsWith("/")) {
        return `${API_ORIGIN}${normalizedImage}`;
    }

    return `${SITE_ORIGIN}/static/logo-2.png`;
};

const normalizeImagePath = (image) => {
    if (typeof image !== "string" || !image.trim()) {
        return image;
    }

    const trimmedImage = image.trim().replace(/\\/g, "/");

    if (/^(https?:)?\/\//i.test(trimmedImage) || trimmedImage.startsWith("data:")) {
        return trimmedImage;
    }

    if (trimmedImage.startsWith("/uploads/")) {
        return trimmedImage;
    }

    if (trimmedImage.startsWith("uploads/")) {
        return `/${trimmedImage}`;
    }

    if (trimmedImage.startsWith("/upload/")) {
        return trimmedImage.replace(/^\/upload\//, "/uploads/");
    }

    if (trimmedImage.startsWith("upload/")) {
        return `/${trimmedImage.replace(/^upload\//, "uploads/")}`;
    }

    return `/uploads/blogs/${trimmedImage.replace(/^\/+/, "")}`;
};

const serializeBlog = (blog) => {
    const data = typeof blog.toObject === "function" ? blog.toObject() : blog;

    return {
        ...data,
        image: normalizeImagePath(data.image),
        tagline: normalizeTagline(data.tagline),
        category: normalizeCategory(data.category),
    };
};

const attachLikeCounts = async (blogs) => {
    const blogIds = blogs.map((blog) => blog._id);

    if (!blogIds.length) {
        return [];
    }

    let likeCounts = [];

    try {
        likeCounts = await BlogLike.aggregate([
            {
                $match: {
                    blogId: { $in: blogIds },
                },
            },
            {
                $group: {
                    _id: "$blogId",
                    count: { $sum: 1 },
                },
            },
        ]);
    } catch (error) {
        console.error("Failed to attach blog like counts:", error);
    }

    const countByBlogId = new Map(
        likeCounts.map((item) => [String(item._id), item.count]),
    );

    return blogs.map((blog) => {
        const serializedBlog = serializeBlog(blog);
        const likesCount = countByBlogId.get(String(blog._id)) || 0;

        return {
            ...serializedBlog,
            likesCount,
        };
    });
};

const attachLikeCount = async (blog) => {
    const [blogWithLikeCount] = await attachLikeCounts([blog]);
    return blogWithLikeCount;
};

/**
 * CREATE BLOG
 * POST /blogs
 */
exports.createBlog = async (req, res) => {
    try {
        const { title, category, desc, author, tagline, date, htmlContent } =
            req.body;

        if (!req.file) {
            return res.status(400).json({
                error: "Blog image is required",
            });
        }

        const blog = await Blog.create({
            title,
            category: normalizeCategory(category),
            desc,
            author,
            tagline: normalizeTagline(tagline),
            date,
            htmlContent,
            image: `/uploads/blogs/${req.file.filename}`,
        });

        return res.status(201).json({
            data: serializeBlog(blog),
            status: 201,
        });
    } catch (err) {
        return res.status(500).json({
            error: "Failed to create blog",
        });
    }
};

/**
 * UPDATE BLOG
 * PUT /blogs/:id
 */
exports.updateBlog = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);

        if (!blog) {
            return res.status(404).json({
                error: "Blog not found",
            });
        }

        const {
            title,
            category,
            desc,
            author,
            tagline,
            date,
            htmlContent,
            isPublished,
        } = req.body;

        blog.title = title ?? blog.title;
        blog.category = normalizeCategory(category ?? blog.category);
        blog.desc = desc ?? blog.desc;
        blog.author = author ?? blog.author;
        if (tagline !== undefined) {
            blog.tagline = normalizeTagline(tagline);
        }
        blog.date = date ?? blog.date;
        blog.htmlContent = htmlContent ?? blog.htmlContent;
        blog.isPublished = isPublished ?? blog.isPublished;

        // If new image uploaded
        if (req.file) {
            blog.image = `/uploads/blogs/${req.file.filename}`;
        }

        await blog.save();

        return res.status(200).json({
            data: serializeBlog(blog),
            status: 200,
        });
    } catch (err) {
        return res.status(500).json({
            error: "Failed to update blog",
        });
    }
};

/**
 * GET ALL BLOGS (NO HTML)
 */
exports.getAllBlogs = async (req, res) => {
    try {
        const blogs = await Blog.find({ isPublished: true })
            .select("-htmlContent")
            .sort({ createdAt: -1 });

        const blogsWithLikeCounts = await attachLikeCounts(blogs);

        return res.status(200).json({ data: blogsWithLikeCounts });
    } catch (err) {
        console.error("Failed to fetch blogs:", err);
        return res.status(500).json({
            error: "Failed to fetch blogs",
        });
    }
};

/**
 * GET BLOG BY ID (WITH HTML)
 */
exports.getBlogById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: "Invalid blog id" });
        }

        const blog = await Blog.findById(req.params.id);
        if (!blog) return res.status(404).json({ error: "Not found" });

        const blogWithLikeCount = await attachLikeCount(blog);

        return res.status(200).json({ data: blogWithLikeCount });
    } catch (err) {
        console.error("Failed to fetch blog:", err);
        return res.status(500).json({
            error: "Failed to fetch blog",
        });
    }
};

/**
 * GET /blog/share/:id
 * Server-rendered social metadata for crawlers that do not execute the React app.
 */
exports.getBlogSharePage = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).type("html").send("Article not found");
        }

        const blog = await Blog.findOne({
            _id: req.params.id,
            isPublished: true,
        }).select("title desc image author");

        if (!blog) {
            return res.status(404).type("html").send("Article not found");
        }

        const articleUrl = `${SITE_ORIGIN}/blogs/${blog._id}`;
        const imageUrl = getAbsoluteBlogImageUrl(blog.image);
        const title = escapeHtml(blog.title);
        const description = escapeHtml(blog.desc);
        const author = escapeHtml(blog.author);
        const safeArticleUrl = escapeHtml(articleUrl);
        const safeImageUrl = escapeHtml(imageUrl);

        res.set({
            "Cache-Control": "public, max-age=300",
            "X-Robots-Tag": "noindex, follow",
        });

        return res.status(200).type("html").send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} | Kanakdhara Investments</title>
  <meta name="description" content="${description}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Kanakdhara Investments">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${safeImageUrl}">
  <meta property="og:image:secure_url" content="${safeImageUrl}">
  <meta property="og:image:alt" content="${title}">
  <meta property="og:url" content="${safeArticleUrl}">
  <meta property="article:author" content="${author}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${safeImageUrl}">
  <link rel="canonical" href="${safeArticleUrl}">
</head>
<body>
  <p>Opening <a href="${safeArticleUrl}">${title}</a>...</p>
  <script>window.location.replace(${JSON.stringify(articleUrl).replace(/</g, "\\u003c")});</script>
</body>
</html>`);
    } catch (err) {
        console.error("Failed to render blog share page:", err);
        return res.status(500).type("html").send("Unable to load article preview");
    }
};
