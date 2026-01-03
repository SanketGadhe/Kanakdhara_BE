const Blog = require("../models/Blog.model");

/**
 * CREATE BLOG
 * POST /blogs
 */
exports.createBlog = async (req, res) => {
    try {
        const {
            title,
            category,
            desc,
            author,
            date,
            htmlContent,
        } = req.body;

        if (!req.file) {
            return res.status(400).json({
                error: "Blog image is required",
            });
        }

        const blog = await Blog.create({
            title,
            category,
            desc,
            author,
            date,
            htmlContent,
            image: `/uploads/blogs/${req.file.filename}`,
        });

        return res.status(201).json({
            data: blog,
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
            date,
            htmlContent,
            isPublished,
        } = req.body;

        blog.title = title ?? blog.title;
        blog.category = category ?? blog.category;
        blog.desc = desc ?? blog.desc;
        blog.author = author ?? blog.author;
        blog.date = date ?? blog.date;
        blog.htmlContent = htmlContent ?? blog.htmlContent;
        blog.isPublished =
            isPublished ?? blog.isPublished;

        // If new image uploaded
        if (req.file) {
            blog.image = `/uploads/blogs/${req.file.filename}`;
        }

        await blog.save();

        return res.status(200).json({
            data: blog,
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
    const blogs = await Blog.find({ isPublished: true })
        .select("-htmlContent")
        .sort({ createdAt: -1 });

    res.status(200).json({ data: blogs });
};

/**
 * GET BLOG BY ID (WITH HTML)
 */
exports.getBlogById = async (req, res) => {
    const blog = await Blog.findById(req.params.id);
    if (!blog)
        return res.status(404).json({ error: "Not found" });

    res.status(200).json({ data: blog });
};
