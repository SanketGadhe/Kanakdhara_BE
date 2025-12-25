const { companyHeaderHtml, customerInfoHtml } = require('./mailContent');
const formatIndianCurrency = (amount, compact = false) => {
    if (amount === undefined || amount === null || isNaN(amount)) return '₹ 0';

    if (compact) {
        if (amount >= 10000000) {
            return `₹ ${(amount / 10000000).toFixed(2)} Cr`;
        }
        if (amount >= 100000) {
            return `₹ ${(amount / 100000).toFixed(2)} L`;
        }
    }

    // Full formatting with Indian commas
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
};
const GOAL_REPORT_CONFIG = {
    "goal-retirement": {
        id: "goal-retirement",
        title: "Retirement Planning",
        description: "Secure your second innings with precision planning.",
        heroImage: "/static/retirement.jpg",
        subGoals: [
            {
                id: "comprehensive",
                title: "Comprehensive Retirement Plan",
                description:
                    "Calculate exactly how much corpus and monthly SIP you need to maintain your lifestyle post-retirement.",
                icon: "ShieldCheck",
                fields: [
                    {
                        id: "current_age",
                        label: "Current Age",
                        type: "years",
                        min: 18,
                        max: 60,
                        step: 1,
                        defaultValue: 30,
                    },
                    {
                        id: "retirement_age",
                        label: "Retirement Age",
                        type: "years",
                        min: 40,
                        max: 80,
                        step: 1,
                        defaultValue: 60,
                    },
                    {
                        id: "life_expectancy",
                        label: "Life Expectancy",
                        type: "years",
                        min: 60,
                        max: 100,
                        step: 1,
                        defaultValue: 85,
                    },
                    {
                        id: "current_expenses",
                        label: "Current Monthly Expenses",
                        type: "currency",
                        min: 10000,
                        max: 500000,
                        step: 500,
                        defaultValue: 50000,
                    },
                    {
                        id: "inflation_rate",
                        label: "Expected Inflation (%)",
                        type: "percentage",
                        min: 0,
                        max: 12,
                        step: 0.1,
                        defaultValue: 6,
                    },
                    {
                        id: "pre_retirement_return",
                        label: "Pre-Retirement Return (%)",
                        type: "percentage",
                        min: 8,
                        max: 25,
                        step: 0.1,
                        defaultValue: 14,
                        disclaimer:
                            "Indian equities (Nifty 50) have given approx. 14% returns over the last 20 years.",
                    },
                    {
                        id: "post_retirement_return",
                        label: "Post-Retirement Return (%)",
                        type: "percentage",
                        min: 8,
                        max: 25,
                        step: 0.1,
                        defaultValue: 8,
                    },
                ],
                calculate: (vals) => {
                    // 1. Years to Retirement
                    const years_to_retirement = vals.retirement_age - vals.current_age;

                    // 2. Monthly Expenses at Retirement (FV of current expenses)
                    const expense_at_retirement =
                        vals.current_expenses *
                        Math.pow(1 + vals.inflation_rate / 100, years_to_retirement);

                    // 3. Corpus Required (PV of Annuity for retirement years adjusted for inflation)
                    const retirement_years = vals.life_expectancy - vals.retirement_age;

                    // Real rate of return formula: (1+nominal)/(1+inflation) - 1
                    const real_return =
                        (1 + vals.post_retirement_return / 100) /
                        (1 + vals.inflation_rate / 100) -
                        1;

                    const months_in_retirement = retirement_years * 12;
                    const monthly_real_return = real_return / 12;

                    // Corpus = Monthly Expense * [ (1 - (1+r)^-n) / r ]
                    // Using monthly real return for monthly drawdowns
                    const corpus_required =
                        expense_at_retirement *
                        ((1 - Math.pow(1 + monthly_real_return, -months_in_retirement)) /
                            monthly_real_return);

                    // 4. Monthly SIP
                    // Rate for pre-retirement accumulation
                    const monthly_rate = vals.pre_retirement_return / 100 / 12;
                    const investment_months = years_to_retirement * 12;

                    // SIP Formula: P = FV / [ ( (1+i)^n - 1 ) / i * (1+i) ]
                    const monthly_sip =
                        corpus_required /
                        (((Math.pow(1 + monthly_rate, investment_months) - 1) /
                            monthly_rate) *
                            (1 + monthly_rate));
                    function roundToTwo(num) {
                        if (typeof num !== "number" || isNaN(num)) {
                            throw new Error("Input must be a valid number");
                        }
                        return Number(num.toFixed(2)); // Convert back to number
                    }

                    return {
                        totalCorpus: {
                            value: Math.round(corpus_required),
                            label: "Total Corpus",
                        },
                        monthlySIP: Math.round(monthly_sip),
                        breakdown: [
                            {
                                label: "Years to Retire",
                                value: `${years_to_retirement} Years`,
                            },
                            {
                                label: "Monthly Expense @ Ret.",
                                value: formatIndianCurrency(
                                    Math.round(expense_at_retirement),
                                    true
                                ),
                                tooltip: formatIndianCurrency(
                                    Math.round(expense_at_retirement)
                                ),
                            },
                            {
                                label: "Retirement Duration",
                                value: `${retirement_years} Years`,
                            },
                            {
                                label: "Real Return (Post Retirement)",
                                value: `${roundToTwo(
                                    ((1 + vals.post_retirement_return / 100) /
                                        (1 + vals.inflation_rate / 100) -
                                        1) *
                                    100
                                )}%`,
                            },
                        ],
                    };
                },
            },
            {
                id: "deferred-swp",
                title: "Deferred SWP Calculator",
                description:
                    "Estimate how much income you can withdraw after allowing your investments to grow.",
                icon: "TrendingUp",
                fields: [
                    {
                        id: "current_corpus",
                        label: "Current Corpus",
                        type: "currency",
                        min: 100000,
                        max: 250000000,
                        step: 50000,
                        defaultValue: 5000000,
                    },
                    {
                        id: "growth_rate",
                        label: "Growth Rate Before SWP (%)",
                        type: "percentage",
                        min: 6,
                        max: 18,
                        step: 0.5,
                        defaultValue: 12,
                    },
                    {
                        id: "defer_years",
                        label: "Years Before SWP Starts",
                        type: "years",
                        min: 1,
                        max: 30,
                        step: 1,
                        defaultValue: 10,
                    },
                    {
                        id: "swp_rate",
                        label: "Return During SWP (%)",
                        type: "percentage",
                        min: 4,
                        max: 12,
                        step: 0.5,
                        defaultValue: 8,
                    },
                    {
                        id: "swp_years",
                        label: "SWP Duration (Years)",
                        type: "years",
                        min: 5,
                        max: 40,
                        step: 1,
                        defaultValue: 25,
                    },
                ],
                calculate: (vals) => {
                    // 1. Accumulated Corpus after deferment
                    const accumulatedCorpus =
                        vals.current_corpus *
                        Math.pow(1 + vals.growth_rate / 100, vals.defer_years);

                    // 2. Monthly SWP calculation
                    const monthlyRate = vals.swp_rate / 100 / 12;
                    const months = vals.swp_years * 12;

                    const monthlySWP =
                        (accumulatedCorpus * monthlyRate) /
                        (1 - Math.pow(1 + monthlyRate, -months));

                    return {
                        totalCorpus: {
                            value: Math.round(accumulatedCorpus),
                            label: "Accumlated Corpus",
                        },
                        monthlySWP: Math.round(monthlySWP),
                        breakdown: [
                            {
                                label: "Corpus at SWP Start",
                                value: formatIndianCurrency(
                                    Math.round(accumulatedCorpus),
                                    true
                                ),
                                tooltip: formatIndianCurrency(Math.round(accumulatedCorpus)),
                            },
                            { label: "SWP Duration", value: `${vals.swp_years} Years` },
                            {
                                label: "Monthly Income",
                                value: formatIndianCurrency(Math.round(monthlySWP), true),
                                tooltip: formatIndianCurrency(Math.round(monthlySWP)),
                            },
                        ],
                    };
                },
            },
            {
                id: "immediate-swp",
                title: "Immediate SWP Calculator",
                description:
                    "Calculate sustainable monthly income from your existing retirement corpus.",
                icon: "Wallet",
                fields: [
                    {
                        id: "accumulated_corpus",
                        label: "Current Retirement Corpus",
                        type: "currency",
                        min: 500000,
                        max: 100000000,
                        step: 50000,
                        defaultValue: 10000000,
                    },
                    {
                        id: "swp_rate",
                        label: "Withdrawal Rate (%)",
                        type: "percentage",
                        min: 4,
                        max: 12,
                        step: 0.5,
                        defaultValue: 8,
                    },
                    {
                        id: "swp_years",
                        label: "Withdrawal Period (Years)",
                        type: "years",
                        min: 5,
                        max: 40,
                        step: 1,
                        defaultValue: 25,
                    },
                ],
                calculate: (vals) => {
                    const monthlyRate = vals.swp_rate / 100 / 12;
                    const months = vals.swp_years * 12;

                    const maxSWP =
                        (vals.accumulated_corpus * monthlyRate) /
                        (1 - Math.pow(1 + monthlyRate, -months));

                    return {
                        totalCorpus: {
                            value: vals.accumulated_corpus,
                            label: "Accumalated Corpus",
                        },
                        breakdown: [
                            { label: "SWP Period", value: `${vals.swp_years} Years` },
                            {
                                label: "Monthly Income",
                                value: formatIndianCurrency(Math.round(maxSWP), true),
                                tooltip: formatIndianCurrency(Math.round(maxSWP)),
                            },
                        ],
                    };
                },
            },
            {
                id: "portfolio-forecast",
                title: "Portfolio Forecast",
                description:
                    "See how your retirement portfolio grows over time across multiple assets.",
                icon: "PieChart",
                fields: [
                    {
                        id: "equity_amount",
                        label: "Equity Investment",
                        type: "currency",
                        min: 0,
                        max: 50000000,
                        step: 10000,
                        defaultValue: 1000000,
                    },
                    {
                        id: "equity_rate",
                        label: "Equity Return (%)",
                        type: "percentage",
                        min: 5,
                        max: 25,
                        step: 0.1,
                        defaultValue: 14,
                        disclaimer:
                            "Indian equities (Nifty 50) have given approx. 14% returns over the last 20 years.",
                    },
                    {
                        id: "debt_amount",
                        label: "Debt Investment",
                        type: "currency",
                        min: 0,
                        max: 100000000,
                        step: 5000,
                        defaultValue: 150000,
                    },
                    {
                        id: "debt_rate",
                        label: "Debt Return (%)",
                        type: "percentage",
                        min: 3,
                        max: 25,
                        step: 0.1,
                        defaultValue: 7.1,
                    },
                    {
                        id: "real_estate",
                        label: "Real Estate Investment",
                        type: "currency",
                        min: 0,
                        max: 50000000,
                        step: 10000,
                        defaultValue: 500000,
                    },
                    {
                        id: "real_estate_rate",
                        label: "Real Estate Return (%)",
                        type: "percentage",
                        min: 2,
                        max: 25,
                        step: 0.1,
                        defaultValue: 6,
                    },
                    {
                        id: "gold_amount",
                        label: "Gold Investment",
                        type: "currency",
                        min: 0,
                        max: 50000000,
                        step: 10000,
                        defaultValue: 500000,
                    },
                    {
                        id: "gold_rate",
                        label: "Gold Return (%)",
                        type: "percentage",
                        min: 2,
                        max: 25,
                        step: 0.1,
                        defaultValue: 8,
                    },
                    {
                        id: "other_amount",
                        label: "Other Investment",
                        type: "currency",
                        min: 0,
                        max: 50000000,
                        step: 10000,
                        defaultValue: 0,
                    },
                    {
                        id: "other_rate",
                        label: "Other Return (%)",
                        type: "percentage",
                        min: 2,
                        max: 25,
                        step: 0.1,
                        defaultValue: 5,
                    },
                ],

                calculate: (vals) => {
                    const years = [5, 10, 15, 20, 25, 30];

                    const forecast = years.map((y) => {
                        const debt =
                            vals.debt_amount *
                            ((Math.pow(1 + vals.debt_rate / 100, y) - 1) /
                                (vals.debt_rate / 100));

                        const equityFV =
                            vals.equity_amount * Math.pow(1 + vals.equity_rate / 100, y);
                        const realEstateFV =
                            vals.real_estate * Math.pow(1 + vals.real_estate_rate / 100, y);
                        const goldFV =
                            vals.gold_amount * Math.pow(1 + vals.gold_rate / 100, y);
                        const otherFV =
                            vals.other_amount * Math.pow(1 + vals.other_rate / 100, y);
                        const equityFVTotal = equityFV + realEstateFV + goldFV + otherFV;

                        return {
                            year: y,
                            debt: Math.round(debt),
                            equity: Math.round(equityFV),
                            realEstate: Math.round(realEstateFV),
                            gold: Math.round(goldFV),
                            other: Math.round(otherFV),
                            total: Math.round(
                                debt + equityFVTotal + otherFV + goldFV + realEstateFV
                            ),
                        };
                    });

                    // const latestTotal = forecast[forecast.length - 1]?.total || 0;
                    const maxYears = Math.max(...years);
                    // const months = maxYears * 12;

                    // const monthlyRate = (vals.equity_rate || 0) / 100 / 12;
                    return {
                        forecast,
                        totalCorpus: {
                            value: forecast[forecast.length - 1]?.total || 0,
                            label: "Forecast Value",
                        },
                        breakdown: forecast.map((f) => ({
                            label: `${f.year} Years`,
                            value: formatIndianCurrency(f.total, true),
                            tooltip: formatIndianCurrency(f.total),
                        })),
                    };
                },
            },
        ],
    },
    "goal-investment": {
        id: "investment-planning",
        title: "Investment Planning",
        description:
            "Build wealth systematically using SIPs and smart allocations.",
        heroImage: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e",
        subGoals: [
            {
                id: "sip-lumpsum",
                title: "SIP + Lumpsum Projection",
                description: "Project future value of SIP and Lumpsum investments.",
                icon: "TrendingUp",
                fields: [
                    {
                        id: "sip",
                        label: "Monthly SIP",
                        type: "currency",
                        min: 0,
                        max: 1000000,
                        step: 500,
                        defaultValue: 10000,
                    },
                    {
                        id: "lumpsum",
                        label: "Lumpsum Investment",
                        type: "currency",
                        min: 0,
                        max: 50000000,
                        step: 10000,
                        defaultValue: 500000,
                    },
                    {
                        id: "years",
                        label: "Duration (Years)",
                        type: "years",
                        min: 1,
                        max: 50,
                        step: 1,
                        defaultValue: 15,
                    },
                    {
                        id: "rate",
                        label: "Expected Return (%)",
                        type: "percentage",
                        min: 0,
                        max: 25,
                        step: 0.1,
                        defaultValue: 14,
                        disclaimer:
                            "Indian equities (Nifty 50) have given approx. 14% returns over the last 20 years.",
                    },
                ],
                calculate: (v) => {
                    const r = v.rate / 100 / 12;
                    const n = v.years * 12;

                    const sipFV = v.sip * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
                    const lumpFV = v.lumpsum * Math.pow(1 + v.rate / 100, v.years);
                    const totlGain = Math.round(
                        sipFV + lumpFV - (v.sip * 12 * v.years + v.lumpsum)
                    );
                    return {
                        totalCorpus: {
                            value: Math.round(sipFV + lumpFV),
                            label: "Total Corpus",
                        },
                        monthlySIP: v.sip,
                        breakdown: [
                            {
                                label: "SIP Value",
                                value: formatIndianCurrency(Math.round(sipFV), true),
                            },
                            {
                                label: "Lumpsum Value",
                                value: formatIndianCurrency(Math.round(lumpFV), true),
                            },
                            {
                                label: "Total Investment Value",
                                value: formatIndianCurrency(
                                    Math.round(v.sip * 12 * v.years) + Math.round(v.lumpsum),
                                    true
                                ),
                                tooltip: formatIndianCurrency(
                                    Math.round(v.sip * 12 * v.years) + Math.round(v.lumpsum)
                                ),
                            },
                            {
                                label: "Total Gain",
                                value: formatIndianCurrency(totlGain, true),
                            },
                        ],
                    };
                },
            },
            {
                id: "stepup-sip",
                title: "Step-Up SIP Planner",
                description: "SIP with annual top-up in absolute ₹ terms plus Lumpsum.",
                icon: "ArrowUp",
                fields: [
                    {
                        id: "sip_start",
                        label: "Starting SIP",
                        type: "currency",
                        min: 1000,
                        max: 200000,
                        step: 500,
                        defaultValue: 10000,
                    },
                    {
                        id: "lumpsum",
                        label: "Lumpsum Investment",
                        type: "currency",
                        min: 0,
                        max: 50000000,
                        step: 10000,
                        defaultValue: 500000,
                    },
                    {
                        id: "stepup",
                        label: "Annual Step-Up (%)",
                        type: "percentage",
                        min: 0,
                        max: 100,
                        step: 1,
                        defaultValue: 10,
                    },
                    {
                        id: "years",
                        label: "Duration",
                        type: "years",
                        min: 1,
                        max: 40,
                        step: 1,
                        defaultValue: 20,
                    },
                    {
                        id: "rate",
                        label: "Expected Return (%)",
                        type: "percentage",
                        min: 8,
                        max: 18,
                        step: 0.5,
                        defaultValue: 14,
                        disclaimer:
                            "Indian equities (Nifty 50) have given approx. 14% returns over the last 20 years.",
                    },
                ],
                calculate: (v) => {
                    const r = v.rate / 100 / 12;
                    const totalMonths = v.years * 12;

                    /* -------- STEP-UP SIP FV -------- */
                    let sipFV = 0;
                    let totalSipInvested = 0;

                    for (let y = 1; y <= v.years; y++) {
                        const sipAmount = v.sip_start * Math.pow(1 + v.stepup / 100, y - 1);
                        totalSipInvested += sipAmount * 12;

                        const monthsLeft = (v.years - y) * 12;

                        const fvYear =
                            sipAmount *
                            ((Math.pow(1 + r, 12) - 1) / r) *
                            Math.pow(1 + r, monthsLeft);

                        sipFV += fvYear;
                    }

                    /* -------- LUMPSUM FV -------- */
                    const lumpsumFV =
                        v.lumpsum > 0 ? v.lumpsum * Math.pow(1 + r, totalMonths) : 0;

                    /* -------- TOTAL CORPUS -------- */
                    const totalCorpus = sipFV + lumpsumFV;
                    const totalLumsumFV = v.sip_start * totalMonths + v.lumpsum;
                    return {
                        totalCorpus: {
                            value: Math.round(totalCorpus),
                            label: "Total Corpus",
                        },
                        breakdown: [
                            {
                                label: "Total SIP Invested",
                                value: formatIndianCurrency(Math.round(totalSipInvested), true),
                                tooltip: formatIndianCurrency(Math.round(totalSipInvested)),
                            },
                            {
                                label: "SIP Value",
                                value: formatIndianCurrency(Math.round(sipFV), true),
                                tooltip: formatIndianCurrency(Math.round(sipFV)),
                            },
                            {
                                label: "Lumpsum Future Value",
                                value: formatIndianCurrency(Math.round(lumpsumFV), true),
                                tooltip: formatIndianCurrency(Math.round(lumpsumFV)),
                            },
                            {
                                label: "Total Gains",
                                value: formatIndianCurrency(
                                    Math.round(totalCorpus - (totalSipInvested + v.lumpsum)),
                                    true
                                ),
                                tooltip: `Calculated on total SIP invested over ${v.years} years.`,
                            },
                        ],
                    };
                },
            },
            {
                id: "crorepati",
                title: "Crorepati Calculator",
                description: "Know how long it takes to reach your first crore.",
                icon: "Crown",
                fields: [
                    {
                        id: "sip",
                        label: "Monthly SIP",
                        type: "currency",
                        min: 1000,
                        max: 500000,
                        step: 500,
                        defaultValue: 15000,
                    },
                    {
                        id: "target",
                        label: "Target (₹ Crores)",
                        type: "number",
                        min: 1,
                        max: 25,
                        step: 1,
                        defaultValue: 1,
                    },
                    {
                        id: "years",
                        label: "Duration (Years)",
                        type: "years",
                        min: 1,
                        max: 40,
                        step: 1,
                        defaultValue: 20,
                    },
                    {
                        id: "rate",
                        label: "Expected Return (%)",
                        type: "percentage",
                        min: 8,
                        max: 25,
                        step: 0.1,
                        defaultValue: 14,
                        disclaimer:
                            "Indian equities (Nifty 50) have given approx. 14% returns over the last 20 years.",
                    },
                ],
                calculate: (v) => {
                    const monthlyRate = v.rate / 100 / 12;
                    const sip = v.sip;
                    const targetAmount = v.target * 1_00_00_000; // crores → rupees

                    let months = 0;
                    let corpus = 0;

                    // Iterative compounding (accurate + intuitive)
                    while (corpus < targetAmount && months < 1000) {
                        corpus = corpus * (1 + monthlyRate) + sip;
                        months++;
                    }

                    const years = Math.floor(months / 12);
                    const remainingMonths = months % 12;

                    return {
                        totalCorpus: {
                            label: "Time Required",
                            currency: false,
                            timeValue: `${years} years ${remainingMonths} months`,
                        },
                        breakdown: [
                            { label: "Total Months", value: months },
                            {
                                label: "Total Investment Value",
                                value: formatIndianCurrency(
                                    Math.round(v.sip * 12 * v.years),
                                    true
                                ),
                            },
                            {
                                label: "Total Gain",
                                value: formatIndianCurrency(
                                    Math.round(targetAmount - v.sip * 12 * v.years),
                                    true
                                ),
                            },
                        ],
                    };
                },
            },
            {
                id: "emi-vs-sip",
                title: "EMI vs SIP Calculator",
                description:
                    "Compare wealth creation via SIP against traditional EMI route.",
                icon: "Repeat",
                fields: [
                    {
                        id: "loan_amount",
                        label: "Loan Amount",
                        type: "currency",
                        min: 100000,
                        max: 50000000,
                        step: 10000,
                        defaultValue: 1000000,
                    },
                    {
                        id: "loan_rate",
                        label: "Loan Interest Rate (%)",
                        type: "percentage",
                        min: 6,
                        max: 15,
                        step: 0.1,
                        defaultValue: 9,
                    },
                    {
                        id: "loan_tenure",
                        label: "Loan Tenure (Years)",
                        type: "years",
                        min: 1,
                        max: 30,
                        step: 1,
                        defaultValue: 15,
                    },
                    {
                        id: "sip_amount",
                        label: "Monthly SIP Amount",
                        type: "currency",
                        min: 0,
                        max: 500000,
                        step: 100,
                        defaultValue: 0,
                    },
                    {
                        id: "sip_rate",
                        label: "SIP Expected Return (%)",
                        type: "percentage",
                        min: 4,
                        max: 25,
                        step: 0.1,
                        defaultValue: 14,
                        disclaimer:
                            "Indian equities (Nifty 50) have given approx. 14% returns over the last 20 years.",
                    },
                ],
                calculate: (v) => {
                    const loanMonthlyRate = v.loan_rate / 100 / 12;
                    const loanMonths = v.loan_tenure * 12;

                    // EMI Formula: EMI = (r * P) / (1 - (1+r)^-n)
                    let emi;
                    if (loanMonthlyRate === 0) {
                        emi = v.loan_amount / loanMonths;
                    } else {
                        emi =
                            (loanMonthlyRate * v.loan_amount) /
                            (1 - Math.pow(1 + loanMonthlyRate, -loanMonths));
                    }
                    const totalEmiPaid = emi * loanMonths;
                    const totalInterestPaid = totalEmiPaid - v.loan_amount;

                    // SIP Future Value
                    const sipMonthlyRate = v.sip_rate / 100 / 12;
                    const sipFV =
                        v.sip_amount *
                        ((Math.pow(1 + sipMonthlyRate, loanMonths) - 1) / sipMonthlyRate);
                    return {
                        totalCorpus: {
                            value: Math.round(totalEmiPaid / loanMonths),
                            label: "Monthly EMI",
                        },
                        breakdown: [
                            {
                                label: "Total EMI Paid",
                                value: formatIndianCurrency(Math.round(totalEmiPaid), true),
                            },
                            {
                                label: "Total Interest Paid",
                                value: formatIndianCurrency(
                                    Math.round(totalInterestPaid),
                                    true
                                ),
                            },
                            {
                                label: "Total Principal Paid",
                                value: formatIndianCurrency(Math.round(v.loan_amount), true),
                            },
                            {
                                label: "SIP Value",
                                value: formatIndianCurrency(Math.round(sipFV), true),
                            },
                            {
                                label: "SIP Invested",
                                value: formatIndianCurrency(
                                    Math.round(v.sip_amount * loanMonths),
                                    true
                                ),
                            },
                            {
                                label: "Net Gain from Investment",
                                value: formatIndianCurrency(
                                    Math.round(sipFV - v.sip_amount * loanMonths),
                                    true
                                ),
                            },
                        ],
                    };
                },
            },
        ],
    },

    "goal-insurance": {
        id: "insurance-planning",
        title: "Insurance Planning",
        description: "Protect your family against financial uncertainty.",
        heroImage: "https://images.unsplash.com/photo-1605902711622-cfb43c44367f",
        subGoals: [
            /* ======================================================
               OPTION 1 — EXPENSE BASED INSURANCE REQUIREMENT
               ====================================================== */
            {
                id: "expense-based-hlv",
                title: "Expense-Based Life Insurance",
                description:
                    "Goal-based insurance requirement using household expenses.",
                icon: "Shield",
                fields: [
                    {
                        id: "dependency_years",
                        label: "Years Dependents Need Support",
                        type: "years",
                        min: 1,
                        max: 50,
                        step: 1,
                        defaultValue: 25,
                    },

                    {
                        id: "monthly_expense",
                        label: "Monthly Household Expense",
                        type: "currency",
                        min: 10000,
                        max: 500000,
                        step: 5000,
                        defaultValue: 60000,
                    },
                    {
                        id: "expense_inflation",
                        label: "Expense Inflation (%)",
                        type: "percentage",
                        min: 3,
                        max: 10,
                        step: 0.1,
                        defaultValue: 6,
                    },

                    {
                        id: "return_rate",
                        label: "Expected Return on Corpus (%)",
                        type: "percentage",
                        min: 4,
                        max: 25,
                        step: 0.1,
                        defaultValue: 6,
                    },

                    {
                        id: "goal_lumpsum",
                        label: "Future Family Goals (Optional)",
                        type: "currency",
                        min: 0,
                        max: 50000000,
                        step: 100000,
                        defaultValue: 0,
                    },
                    {
                        id: "goal_years",
                        label: "Years to Goal",
                        type: "years",
                        min: 0,
                        max: 25,
                        step: 1,
                        defaultValue: 0,
                    },

                    {
                        id: "existing_cover",
                        label: "Existing Life Cover",
                        type: "currency",
                        min: 0,
                        max: 50000000,
                        step: 500000,
                        defaultValue: 0,
                    },
                    {
                        id: "existing_assets",
                        label: "Existing Liquid Assets",
                        type: "currency",
                        min: 0,
                        max: 50000000,
                        step: 500000,
                        defaultValue: 0,
                    },
                    {
                        id: "liabilities",
                        label: "Outstanding Liabilities",
                        type: "currency",
                        min: 0,
                        max: 50000000,
                        step: 500000,
                        defaultValue: 0,
                    },
                ],

                calculate: (v) => {
                    const I = v.expense_inflation / 100;
                    const R = v.return_rate / 100;
                    const Y = v.dependency_years;

                    /* ---- Present Value of Inflation-adjusted Expenses ---- */
                    let pvExpenses = 0;
                    for (let t = 1; t <= Y; t++) {
                        const annualExpense = v.monthly_expense * 12 * Math.pow(1 + I, t);
                        pvExpenses += annualExpense / Math.pow(1 + R, t);
                    }

                    /* ---- Lumpsum Goals (Optional) ---- */
                    let pvGoals = 0;
                    if (v.goal_lumpsum > 0 && v.goal_years > 0) {
                        const fvGoal = v.goal_lumpsum * Math.pow(1 + I, v.goal_years);
                        pvGoals = fvGoal / Math.pow(1 + R, v.goal_years);
                    }

                    /* ---- Total Insurance Required ---- */
                    const insuranceRequired =
                        pvExpenses + pvGoals + v.liabilities - v.existing_assets;

                    const gap = insuranceRequired - v.existing_cover;

                    return {
                        totalCorpus: {
                            value: Math.round(insuranceRequired),
                            label: "Insurance Required",
                        },
                        breakdown: [
                            {
                                label: "Expense Corpus",
                                value: formatIndianCurrency(Math.round(pvExpenses), true),
                                tooltip: formatIndianCurrency(Math.round(pvExpenses)),
                            },
                            {
                                label: "Goals Corpus",
                                value: formatIndianCurrency(Math.round(pvGoals), true),
                                tooltip: formatIndianCurrency(Math.round(pvGoals)),
                            },
                            {
                                label: "Existing Cover",
                                value: formatIndianCurrency(v.existing_cover, true),
                                tooltip: formatIndianCurrency(v.existing_cover),
                            },
                            {
                                label: "Additional Cover Required",
                                value: formatIndianCurrency(Math.max(0, Math.round(gap)), true),
                                tooltip: formatIndianCurrency(
                                    Math.max(0, Math.round(gap)),
                                    true
                                ),
                            },
                        ],
                    };
                },
            },

            /* ======================================================
               OPTION 2 — INCOME BASED HLV (CLASSICAL MODEL)
               ====================================================== */
            {
                id: "income-based-hlv",
                title: "Income-Based Life Insurance (HLV)",
                description: "Classical Human Life Value model for income earners.",
                icon: "TrendingUp",
                fields: [
                    {
                        id: "current_age",
                        label: "Current Age",
                        type: "years",
                        min: 18,
                        max: 60,
                        step: 1,
                        defaultValue: 35,
                    },
                    {
                        id: "retirement_age",
                        label: "Retirement Age",
                        type: "years",
                        min: 45,
                        max: 90,
                        step: 1,
                        defaultValue: 60,
                    },

                    {
                        id: "annual_income",
                        label: "Annual Income",
                        type: "currency",
                        min: 200000,
                        max: 50000000,
                        step: 100000,
                        defaultValue: 1800000,
                    },
                    {
                        id: "family_contribution",
                        label: "Income Contributed to Family (%)",
                        type: "percentage",
                        min: 0,
                        max: 100,
                        step: 5,
                        defaultValue: 100,
                    },

                    {
                        id: "income_growth",
                        label: "Income Growth (%)",
                        type: "percentage",
                        min: 0,
                        max: 50,
                        step: 0.1,
                        defaultValue: 5,
                    },
                    {
                        id: "discount_rate",
                        label: "Expected Return / Discount Rate (%)",
                        type: "percentage",
                        min: 4,
                        max: 25,
                        step: 0.1,
                        defaultValue: 6,
                    },

                    {
                        id: "existing_cover",
                        label: "Existing Life Cover",
                        type: "currency",
                        min: 0,
                        max: 50000000,
                        step: 500000,
                        defaultValue: 0,
                    },
                    {
                        id: "existing_assets",
                        label: "Existing Assets",
                        type: "currency",
                        min: 0,
                        max: 50000000,
                        step: 500000,
                        defaultValue: 0,
                    },
                    {
                        id: "liabilities",
                        label: "Outstanding Liabilities",
                        type: "currency",
                        min: 0,
                        max: 50000000,
                        step: 500000,
                        defaultValue: 0,
                    },
                ],

                calculate: (v) => {
                    const years = v.retirement_age - v.current_age;
                    const G = v.income_growth / 100;
                    const R = v.discount_rate / 100;
                    const C = v.family_contribution / 100;

                    let pvIncome = 0;

                    for (let t = 1; t <= years; t++) {
                        const income = v.annual_income * Math.pow(1 + G, t);
                        const familyIncome = income * C;
                        pvIncome += familyIncome / Math.pow(1 + R, t);
                    }

                    const insuranceRequired =
                        pvIncome + v.liabilities - v.existing_assets;

                    const gap = insuranceRequired - v.existing_cover;

                    return {
                        totalCorpus: {
                            value: Math.round(insuranceRequired),
                            label: "Net Insurance Required",
                        },
                        breakdown: [
                            {
                                label: "Human Life Value",
                                value: formatIndianCurrency(Math.round(pvIncome), true),
                                tooltip: formatIndianCurrency(Math.round(pvIncome)),
                            },
                            {
                                label: "Existing Cover",
                                value: formatIndianCurrency(v.existing_cover, true),
                                tooltip: formatIndianCurrency(v.existing_cover),
                            },
                            {
                                label: "Additional Cover Required",
                                value: formatIndianCurrency(Math.max(0, Math.round(gap)), true),
                                tooltip: formatIndianCurrency(Math.max(0, Math.round(gap))),
                            },
                            {
                                label: "Net Asset (Total Assets- Total Liabilities)",
                                value: formatIndianCurrency(
                                    v.existing_assets - v.liabilities,
                                    true
                                ),
                                tooltip: formatIndianCurrency(
                                    v.existing_assets - v.liabilities
                                ),
                            },
                        ],
                    };
                },
            },
        ],
    },

    "goal-travel": {
        id: "dream-travel",
        title: "Dream Travel Planning",
        description: "Plan your dream vacation stress-free.",
        heroImage: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
        subGoals: [
            {
                id: "travel-sip",
                title: "Travel SIP Planner",
                description: "Monthly SIP for your dream travel.",
                icon: "Plane",
                fields: [
                    {
                        id: "budget",
                        label: "Travel Budget",
                        type: "currency",
                        min: 100000,
                        max: 10000000,
                        step: 50000,
                        defaultValue: 500000,
                    },
                    {
                        id: "years",
                        label: "Time Horizon",
                        type: "years",
                        min: 1,
                        max: 10,
                        step: 1,
                        defaultValue: 3,
                    },
                    {
                        id: "rate",
                        label: "Expected Return (%)",
                        type: "percentage",
                        min: 6,
                        max: 14,
                        step: 0.5,
                        defaultValue: 10,
                    },
                    {
                        id: "inflation",
                        label: "Inflation Rate (%)",
                        type: "percentage",
                        min: 0,
                        max: 10,
                        step: 0.5,
                        defaultValue: 5,
                    },
                    {
                        id: "existing_savings",
                        label: "Existing Savings",
                        type: "currency",
                        min: 0,
                        max: 5000000,
                        step: 10000,
                        defaultValue: 0,
                    },
                ],
                calculate: (v) => {
                    const currentCost = Number(v.budget || 0);
                    const years = Number(v.years || 0);
                    const travelInflation = Number(v.inflation || 0);
                    const expectedReturn = Number(v.rate || 0);
                    const existingSavings = Number(v.existing_savings || 0);

                    // Step 1: Inflate current cost to future value using travel inflation
                    const inflatedCost =
                        currentCost * Math.pow(1 + travelInflation / 100, years);

                    // Step 2: Future value of existing savings at expected return
                    const existingSavingsFV =
                        existingSavings * Math.pow(1 + expectedReturn / 100, years);

                    // Net target after accounting for existing savings FV
                    const netTarget = Math.max(inflatedCost - existingSavingsFV, 0);

                    // SIP calculation
                    const monthlyRate = expectedReturn / 100 / 12;
                    const months = Math.max(1, years * 12);

                    let monthlySIP = 0;
                    if (monthlyRate === 0) {
                        monthlySIP = netTarget / months;
                    } else {
                        monthlySIP =
                            (netTarget * monthlyRate) /
                            (Math.pow(1 + monthlyRate, months) - 1);
                    }

                    // Lumpsum required today (discount net target back by expected return)
                    const lumpsumRequiredToday =
                        netTarget / Math.pow(1 + expectedReturn / 100, years);

                    return {
                        totalCorpus: {
                            value: Math.round(monthlySIP),
                            label: "Mothly Sip Required",
                        },
                        breakdown: [
                            {
                                label: "Inflated Vacation Cost",
                                value: formatIndianCurrency(Math.round(inflatedCost), true),
                                tooltip: formatIndianCurrency(Math.round(inflatedCost)),
                            },
                            {
                                label: "Existing Savings Future Value",
                                value: formatIndianCurrency(
                                    Math.round(existingSavingsFV),
                                    true
                                ),
                                tooltip: formatIndianCurrency(Math.round(existingSavingsFV)),
                            },
                            {
                                label: "Net Target Amount",
                                value: formatIndianCurrency(Math.round(netTarget), true),
                                tooltip: formatIndianCurrency(Math.round(netTarget)),
                            },
                            {
                                label: "Lumpsum Required Today",
                                value: formatIndianCurrency(
                                    Math.round(lumpsumRequiredToday),
                                    true
                                ),
                                tooltip: formatIndianCurrency(Math.round(lumpsumRequiredToday)),
                            },
                        ],
                    };
                },
            },
        ],
    },
    /* ===================== OTHER LIFE GOALS ===================== */
    "goal-others": {
        id: "other-goals",
        title: "Other Life Goals",
        description: "Plan important financial milestones across life stages.",
        heroImage: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1",
        subGoals: [
            /* ================= CHILD EDUCATION ================= */
            {
                id: "child-education",
                title: "Child Education Planning",
                description:
                    "Plan higher education expenses with inflation adjustment.",
                icon: "GraduationCap",
                fields: [
                    {
                        id: "cost_today",
                        label: "Education Cost Today",
                        type: "currency",
                        min: 0,
                        max: 100000000,
                        step: 100000,
                        defaultValue: 3000000,
                    },
                    {
                        id: "inflation",
                        label: "Education Inflation (%)",
                        type: "percentage",
                        min: 0,
                        max: 12,
                        step: 0.1,
                        defaultValue: 6,
                    },
                    {
                        id: "years",
                        label: "Years to Goal",
                        type: "years",
                        min: 1,
                        max: 30,
                        step: 1,
                        defaultValue: 15,
                    },
                    {
                        id: "rate",
                        label: "Expected Return (%)",
                        type: "percentage",
                        min: 5,
                        max: 25,
                        step: 0.1,
                        defaultValue: 12,
                    },
                ],
                calculate: (v) => {
                    const fv = v.cost_today * Math.pow(1 + v.inflation / 100, v.years);
                    const r = v.rate / 100 / 12;
                    const n = v.years * 12;

                    const sip = (fv * r) / (Math.pow(1 + r, n) - 1);
                    const lumpsum = fv / Math.pow(1 + v.rate / 100, v.years);

                    return {
                        totalCorpus: { value: Math.round(fv), label: "Future Value" },
                        monthlySIP: Math.round(sip),
                        lumpsumRequired: Math.round(lumpsum),
                    };
                },
            },

            /* ================= CHILD MARRIAGE ================= */
            {
                id: "child-marriage",
                title: "Marriage Planning",
                description:
                    "Prepare financially for marriage expenses with inflation.",
                icon: "Heart",
                fields: [
                    {
                        id: "cost_today",
                        label: "Marriage Cost Today",
                        type: "currency",
                        min: 500000,
                        max: 50000000,
                        step: 100000,
                        defaultValue: 2000000,
                    },
                    {
                        id: "inflation",
                        label: "Marriage Inflation (%)",
                        type: "percentage",
                        min: 0,
                        max: 12,
                        step: 0.1,
                        defaultValue: 6,
                    },
                    {
                        id: "years",
                        label: "Years to Goal",
                        type: "years",
                        min: 1,
                        max: 25,
                        step: 1,
                        defaultValue: 18,
                    },
                    {
                        id: "rate",
                        label: "Expected Return (%)",
                        type: "percentage",
                        min: 5,
                        max: 25,
                        step: 0.5,
                        defaultValue: 11,
                    },
                ],
                calculate: (v) => {
                    const fv = v.cost_today * Math.pow(1 + v.inflation / 100, v.years);
                    const r = v.rate / 100 / 12;
                    const n = v.years * 12;

                    const sip = (fv * r) / (Math.pow(1 + r, n) - 1);
                    const lumpsum = fv / Math.pow(1 + v.rate / 100, v.years);

                    return {
                        totalCorpus: { value: Math.round(fv), label: "Future Value" },
                        monthlySIP: Math.round(sip),
                        lumpsumRequired: Math.round(lumpsum),
                    };
                },
            },

            /* ================= EMERGENCY FUND ================= */
            {
                id: "emergency-fund",
                title: "Emergency Fund Planning",
                description: "Build a liquid emergency buffer (no market risk).",
                icon: "AlertTriangle",
                fields: [
                    {
                        id: "monthly_expense",
                        label: "Monthly Expense",
                        type: "currency",
                        min: 10000,
                        max: 5000000,
                        step: 5000,
                        defaultValue: 50000,
                    },
                    {
                        id: "months",
                        label: "Emergency Coverage (Months)",
                        type: "number",
                        min: 3,
                        max: 36,
                        step: 1,
                        defaultValue: 6,
                    },
                    {
                        id: "optionalSpending",
                        label: "Optional Spending (%)",
                        type: "percentage",
                        min: 0,
                        max: 50,
                        step: 0.1,
                        defaultValue: 10,
                    },
                ],
                calculate: (v) => {
                    const corpus =
                        v.monthly_expense * v.months * (1 - v.optionalSpending / 100);
                    return {
                        totalCorpus: { value: Math.round(corpus), label: "Total Corpus" },
                    };
                },
            },

            /* ================= HOME PURCHASE ================= */
            {
                id: "home-purchase",
                title: "Home Purchase Planning",
                description: "Plan down payment for your dream home.",
                icon: "Home",
                fields: [
                    {
                        id: "current_value",
                        label: "Current Property Value",
                        type: "currency",
                        min: 500000,
                        max: 50000000,
                        step: 100000,
                        defaultValue: 2500000,
                    },
                    {
                        id: "property_appreciation",
                        label: "Property Appreciation (%)",
                        type: "percentage",
                        min: 0,
                        max: 15,
                        step: 0.1,
                        defaultValue: 5,
                    },
                    {
                        id: "years",
                        label: "Years to Buy",
                        type: "years",
                        min: 1,
                        max: 25,
                        step: 1,
                        defaultValue: 5,
                    },
                    {
                        id: "down_payment",
                        label: "Down Payment (%)",
                        type: "percentage",
                        min: 10,
                        max: 100,
                        step: 1,
                        defaultValue: 50,
                    },
                    {
                        id: "home_loan_rate",
                        label: "Home Loan Rate (%)",
                        type: "percentage",
                        min: 6,
                        max: 12,
                        step: 0.1,
                        defaultValue: 8,
                    },
                    {
                        id: "tenure_years",
                        label: "Loan Tenure (Years)",
                        type: "years",
                        min: 5,
                        max: 30,
                        step: 1,
                        defaultValue: 20,
                    },
                    {
                        id: "existing_savings",
                        label: "Existing Savings for Down Payment",
                        type: "currency",
                        min: 0,
                        max: 50000000,
                        step: 10000,
                        defaultValue: 0,
                    },
                    {
                        id: "investment_rate",
                        label: "Investment Return Rate (%)",
                        type: "percentage",
                        min: 5,
                        max: 25,
                        step: 0.1,
                        defaultValue: 10,
                    },
                ],
                calculate: (v) => {
                    // 1️⃣ Future property value
                    const futurePropertyValue =
                        v.current_value *
                        Math.pow(1 + v.property_appreciation / 100, v.years);

                    // 2️⃣ Down payment
                    const downPaymentAmount =
                        futurePropertyValue * (v.down_payment / 100);

                    // 3️⃣ SIP for down payment
                    const sipMonthlyRate = v.investment_rate / 100 / 12;
                    const sipMonths = v.years * 12;

                    let sipDownPayment = 0;
                    if (sipMonthlyRate === 0) {
                        sipDownPayment = downPaymentAmount / sipMonths;
                    } else {
                        sipDownPayment =
                            (downPaymentAmount * sipMonthlyRate) /
                            (Math.pow(1 + sipMonthlyRate, sipMonths) - 1);
                    }

                    // 4️⃣ Loan calculations
                    const loanAmount = futurePropertyValue - downPaymentAmount;

                    const loanMonthlyRate = v.home_loan_rate / 100 / 12;
                    const loanMonths = v.tenure_years * 12;

                    // Correct EMI formula
                    const emi =
                        (loanAmount *
                            loanMonthlyRate *
                            Math.pow(1 + loanMonthlyRate, loanMonths)) /
                        (Math.pow(1 + loanMonthlyRate, loanMonths) - 1);

                    const totalPayment = emi * loanMonths;
                    const totalInterest = totalPayment - loanAmount;

                    return {
                        totalCorpus: { value: Math.round(emi), label: "Monthly EMI" },
                        breakdown: [
                            {
                                label: "Future Property Value",
                                value: formatIndianCurrency(
                                    Math.round(futurePropertyValue),
                                    true
                                ),
                                tooltip: formatIndianCurrency(Math.round(futurePropertyValue)),
                            },
                            {
                                label: "Down Payment Required",
                                value: formatIndianCurrency(
                                    Math.round(downPaymentAmount),
                                    true
                                ),
                                tooltip: formatIndianCurrency(Math.round(downPaymentAmount)),
                            },
                            {
                                label: "Monthly SIP for Down Payment",
                                value: formatIndianCurrency(Math.round(sipDownPayment), true),
                                tooltip: formatIndianCurrency(Math.round(sipDownPayment)),
                            },
                            {
                                label: "Loan Amount",
                                value: formatIndianCurrency(Math.round(loanAmount), true),
                                tooltip: formatIndianCurrency(Math.round(loanAmount)),
                            },
                            {
                                label: "Total Loan Payment",
                                value: formatIndianCurrency(Math.round(totalPayment), true),
                                tooltip: formatIndianCurrency(Math.round(totalPayment)),
                            },
                            {
                                label: "Total Interest Payable",
                                value: formatIndianCurrency(Math.round(totalInterest), true),
                                tooltip: formatIndianCurrency(Math.round(totalInterest)),
                            },
                        ],
                    };
                },
            },

            /* ================= CAR PURCHASE ================= */
            {
                id: "car-purchase",
                title: "Car Purchase Planning",
                description:
                    "Understand the real cost of your dream car and fund it smartly.",
                icon: "Car",
                fields: [
                    {
                        id: "currentCarPrice",
                        label: "Current Car Price",
                        type: "currency",
                        min: 100000,
                        max: 50000000,
                        step: 50000,
                        defaultValue: 1500000,
                    },

                    {
                        id: "carInflation",
                        label: "Car Price Inflation (%)",
                        type: "percentage",
                        min: 0,
                        max: 15,
                        step: 0.1,
                        defaultValue: 6,
                    },

                    {
                        id: "yearsToPurchase",
                        label: "Years to Purchase",
                        type: "years",
                        min: 1,
                        max: 10,
                        step: 1,
                        defaultValue: 3,
                    },

                    {
                        id: "downPaymentPercent",
                        label: "Down Payment (%)",
                        type: "percentage",
                        min: 10,
                        max: 100,
                        step: 1,
                        defaultValue: 50,
                    },

                    {
                        id: "existingSavings",
                        label: "Existing Savings",
                        type: "currency",
                        min: 0,
                        max: 50000000,
                        step: 10000,
                        defaultValue: 0,
                    },

                    {
                        id: "investmentReturn",
                        label: "Investment Return (%)",
                        type: "percentage",
                        min: 5,
                        max: 25,
                        step: 0.1,
                        defaultValue: 8,
                    },

                    {
                        id: "carLoanInterest",
                        label: "Car Loan Interest (%)",
                        type: "percentage",
                        min: 6,
                        max: 25,
                        step: 0.1,
                        defaultValue: 9.5,
                    },

                    {
                        id: "loanTenureYears",
                        label: "Loan Tenure (Years)",
                        type: "years",
                        min: 1,
                        max: 10,
                        step: 1,
                        defaultValue: 5,
                    },
                ],

                calculate: (v) => {
                    /* 1️⃣ Future car price */
                    const futureCarPrice =
                        v.currentCarPrice *
                        Math.pow(1 + v.carInflation / 100, v.yearsToPurchase);

                    /* 2️⃣ Down payment */
                    const downPayment = (futureCarPrice * v.downPaymentPercent) / 100;

                    /* 3️⃣ Existing savings future value */
                    const existingSavingsFV =
                        v.existingSavings *
                        Math.pow(1 + v.investmentReturn / 100, v.yearsToPurchase);

                    const netDownPaymentRequired = Math.max(
                        downPayment - existingSavingsFV,
                        0
                    );

                    /* 4️⃣ SIP for down payment */
                    const sipRate = v.investmentReturn / 100 / 12;
                    const sipMonths = v.yearsToPurchase * 12;

                    let sipAmount = 0;
                    if (sipRate === 0) {
                        sipAmount = netDownPaymentRequired / sipMonths;
                    } else {
                        sipAmount =
                            (netDownPaymentRequired * sipRate) /
                            (Math.pow(1 + sipRate, sipMonths) - 1);
                    }

                    /* 5️⃣ Loan & EMI */
                    const loanAmount = futureCarPrice - downPayment;
                    const loanRate = v.carLoanInterest / 100 / 12;
                    const loanMonths = v.loanTenureYears * 12;

                    const emi =
                        (loanAmount * loanRate * Math.pow(1 + loanRate, loanMonths)) /
                        (Math.pow(1 + loanRate, loanMonths) - 1);

                    const totalLoanPayment = emi * loanMonths;
                    const totalLoanInterest = totalLoanPayment - loanAmount;

                    return {
                        totalCorpus: { value: Math.round(emi), label: "Monthly EMI" },
                        breakdown: [
                            {
                                label: "Future Car Price",
                                value: formatIndianCurrency(Math.round(futureCarPrice), true),
                                tooltip: formatIndianCurrency(Math.round(futureCarPrice)),
                            },
                            {
                                label: "Down Payment Required",
                                value: formatIndianCurrency(Math.round(downPayment), true),
                                tooltip: formatIndianCurrency(Math.round(downPayment)),
                            },
                            {
                                label: "Existing Savings (Future Value)",
                                value: formatIndianCurrency(Math.round(existingSavingsFV)),
                                tooltip: formatIndianCurrency(
                                    Math.round(existingSavingsFV),
                                    true
                                ),
                            },
                            {
                                label: "Monthly SIP for Down Payment",
                                value: formatIndianCurrency(Math.round(sipAmount), true),
                                tooltip: formatIndianCurrency(Math.round(sipAmount)),
                            },
                            {
                                label: "Loan Amount",
                                value: formatIndianCurrency(Math.round(loanAmount)),
                                tooltip: formatIndianCurrency(Math.round(loanAmount), true),
                            },
                            {
                                label: "Total Interest on Loan",
                                value: formatIndianCurrency(
                                    Math.round(totalLoanInterest),
                                    true
                                ),
                                tooltip: formatIndianCurrency(Math.round(totalLoanInterest)),
                            },
                        ],
                    };
                },
            },
            /* ================= WEALTH CREATION ================= */
            {
                id: "wealth-creation",
                title: "Wealth Creation Goal",
                description: "Mathematically solved long-term wealth planning.",
                icon: "TrendingUp",
                fields: [
                    {
                        id: "targetAmount",
                        label: "Target Amount (Today’s Value)",
                        type: "currency",
                        min: 1000000,
                        max: 1000000000,
                        step: 500000,
                        defaultValue: 50000000,
                    },
                    {
                        id: "years",
                        label: "Time Horizon (Years)",
                        type: "years",
                        min: 5,
                        max: 40,
                        step: 1,
                        defaultValue: 20,
                    },
                    {
                        id: "expectedReturn",
                        label: "Expected Return (%)",
                        type: "percentage",
                        min: 5,
                        max: 20,
                        step: 0.1,
                        defaultValue: 12,
                    },
                    {
                        id: "inflation",
                        label: "Inflation (%)",
                        type: "percentage",
                        min: 0,
                        max: 10,
                        step: 0.1,
                        defaultValue: 6,
                    },
                    {
                        id: "lumpsum",
                        label: "Existing Investment (₹)",
                        type: "currency",
                        min: 0,
                        max: 100000000,
                        step: 100000,
                        defaultValue: 500000,
                    },
                    {
                        id: "stepUpPercent",
                        label: "Annual SIP Step-Up (%)",
                        type: "percentage",
                        min: 0,
                        max: 20,
                        step: 1,
                        defaultValue: 10,
                    },
                ],

                calculate: (v) => {
                    function adjustTargetForInflation(target, inflation, years) {
                        if (!inflation || inflation === 0) return target;
                        return target * Math.pow(1 + inflation / 100, years);
                    }

                    function futureValueLumpsum(lumpsum, years, annualReturn) {
                        return lumpsum * Math.pow(1 + annualReturn / 100, years);
                    }

                    function stepUpSIPFutureValue(
                        startingSIP,
                        stepUp,
                        years,
                        annualReturn
                    ) {
                        const r = annualReturn / 100 / 12;
                        let totalFV = 0;

                        for (let year = 1; year <= years; year++) {
                            const sip = startingSIP * Math.pow(1 + stepUp / 100, year - 1);

                            const fvYear =
                                sip *
                                ((Math.pow(1 + r, 12) - 1) / r) *
                                Math.pow(1 + r, (years - year) * 12);

                            totalFV += fvYear;
                        }

                        return totalFV;
                    }
                    function solveRequiredSIP({
                        targetAmount,
                        years,
                        expectedReturn,
                        stepUpPercent,
                        lumpsum = 0,
                        inflation = 0,
                    }) {
                        const nominalTarget = adjustTargetForInflation(
                            targetAmount,
                            inflation,
                            years
                        );

                        const lumpsumFV = futureValueLumpsum(
                            lumpsum,
                            years,
                            expectedReturn
                        );

                        const netTarget = Math.max(nominalTarget - lumpsumFV, 0);

                        let sip = 1000;
                        let fv = 0;

                        while (sip < 10_00_000) {
                            // sanity cap
                            fv = stepUpSIPFutureValue(
                                sip,
                                stepUpPercent,
                                years,
                                expectedReturn
                            );

                            if (fv >= netTarget) break;
                            sip += 100;
                        }

                        return {
                            requiredMonthlySIP: sip,
                            targetNominal: Math.round(nominalTarget),
                            lumpsumFutureValue: Math.round(lumpsumFV),
                            netTargetRequired: Math.round(netTarget),
                        };
                    }

                    const result = solveRequiredSIP({
                        targetAmount: v.targetAmount,
                        years: v.years,
                        expectedReturn: v.expectedReturn,
                        inflation: v.inflation,
                        lumpsum: v.lumpsum,
                        stepUpPercent: v.stepUpPercent,
                    });

                    return {
                        totalCorpus: {
                            value: result.requiredMonthlySIP,
                            label: "Monthly SIP Required",
                        },
                        breakdown: [
                            {
                                label: "Inflation Adjusted Target",
                                value: formatIndianCurrency(result.targetNominal, true),
                                tooltip: formatIndianCurrency(result.targetNominal),
                            },
                            {
                                label: "Existing Investment (Future Value)",
                                value: formatIndianCurrency(result.lumpsumFutureValue, true),
                                tooltip: formatIndianCurrency(result.lumpsumFutureValue),
                            },
                            {
                                label: "Net Target to be Built",
                                value: formatIndianCurrency(result.netTargetRequired, true),
                                tooltip: formatIndianCurrency(result.netTargetRequired),
                            },
                        ],
                    };
                },
            },
        ],
    },
};

function goalContextHtml(payload, goalConfig, subGoalConfig) {
    const { user, meta } = payload;

    return `
  <div class="grid grid-cols-2 gap-6 bg-slate-50 p-3 rounded-2xl border mb-5">
    <div>
      <h4 class="text-sm font-bold text-slate-900 mb-2 uppercase">Customer</h4>
      <p class="text-sm"><strong>Name:</strong> ${user.name}</p>
      <p class="text-sm"><strong>Email:</strong> ${user.email}</p>
      <p class="text-sm"><strong>Phone:</strong> ${user.phone || '-'}</p>
      <p class="text-sm"><strong>Age:</strong> ${user.age ?? '-'}</p>
    </div>

    <div>
      <h4 class="text-sm font-bold text-slate-900 mb-2 uppercase">Goal Details</h4>
      <p class="text-sm"><strong>Goal:</strong> ${goalConfig.title}</p>
      <p class="text-sm"><strong>Sub Goal:</strong> ${subGoalConfig.title}</p>
      <p class="text-sm"><strong>Generated:</strong> ${new Date(meta.generatedAt).toLocaleDateString()}</p>
    </div>
  </div>
  `;
}
function staticSliderHtml(
    label,
    value,
    min,
    max,
    suffix = ''
) {
    // Coerce to numbers and guard against invalid values
    const minNum = Number.isFinite(min) ? Number(min) : NaN;
    const maxNum = Number.isFinite(max) ? Number(max) : NaN;
    const valNum = Number.isFinite(value) ? Number(value) : (Number.isFinite(minNum) ? minNum : 0);

    let percent = 0;
    if (!Number.isNaN(minNum) && !Number.isNaN(maxNum) && maxNum > minNum) {
        percent = Math.round(((valNum - minNum) / (maxNum - minNum)) * 100);
        percent = Math.max(0, Math.min(100, percent));
    }

    return `
  <div class="space-y-3">

    <!-- Slider Track -->
    <div class="relative h-2 rounded-lg bg-slate-200 overflow-hidden">

      <!-- FILLED TRACK (THIS WAS MISSING) -->
      <div
        class="absolute left-0 top-0 h-2 bg-brand-600 rounded-lg"
        style="width:${percent}%"
      ></div>

      <!-- THUMB -->
      <div
        class="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-brand-600 rounded-full shadow"
        style="left:calc(${percent}% - 8px), color: #c68a4b"
      ></div>
    </div>

    <!-- Min / Max -->
    <div class="flex justify-between text-[10px] font-bold text-slate-300">
      <span>${min}</span>
      <span>${max}</span>
    </div>

  </div>
  `;
}

function renderFieldHtml(field, value) {
    if (field.type === 'boolean') {
        return `
        <div class="mb-2">
          <div class="flex justify-between items-center">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-widest">
              ${field.label}
            </label>
            <div class="bg-brand-50 border border-brand-100 text-brand-700 font-bold px-3 py-1 rounded-lg text-sm">
              ${value ? 'Yes' : 'No'}
            </div>
          </div>
        </div>
        `;
    }

    const percent =
        field.max !== undefined && field.min !== undefined
            ? Math.max(0, Math.min(100, ((value - field.min) / (field.max - field.min)) * 100))
            : 0;

    return `
    <div class="mb-2">
      <!-- Label + Value -->
      <div class="flex justify-between items-center mb-2">
        <label class="text-xs font-bold text-slate-500 uppercase tracking-widest">
          ${field.label}
        </label>
        <div class="bg-brand-50 border border-brand-100 text-brand-700 font-bold px-3 py-1 rounded-lg text-sm" >
          ${formatIndianCurrency(value)}
        </div>
      </div>

      ${field.disclaimer
            ? `
        <div class="mt-2 text-[10px] text-emerald-600 bg-emerald-50 p-2 rounded-md border border-emerald-100">
          ${field.disclaimer}
        </div>
        `
            : ''
        }
    </div>
    `;
}


function corpusCircleHtml(totalCorpus) {
    const isTimeBased = totalCorpus?.currency === false || totalCorpus?.timeValue;

    return `
    <div class="relative w-80 h-80 flex items-center justify-center">
      <svg class="w-full h-full -rotate-90">
        <circle cx="50%" cy="50%" r="120"
          stroke="rgba(255,255,255,0.1)" stroke-width="12" fill="none" />
        <circle cx="50%" cy="50%" r="120"
          stroke="#c68a4b" stroke-width="12" fill="none"
          stroke-dasharray="754" stroke-dashoffset="0"
          stroke-linecap="round" />
      </svg>

      <div class="absolute text-center px-4">
        <p class="text-brand-400 text-xs font-bold uppercase tracking-widest mb-2">
          ${totalCorpus.label}
        </p>
        <h2 class="text-4xl font-serif font-bold text-white">
          ${isTimeBased
            ? totalCorpus.timeValue
            : formatIndianCurrency(totalCorpus.value, true)}
        </h2>
      </div>
    </div>
    `;
}


function generateGoalReportHtml(
    payload,
    goalConfig,
    subGoalConfig
) {
    const { inputs, results } = payload;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <script src="https://cdn.tailwindcss.com"></script>
  </head>

<body class="bg-slate-100 p-4 font-sans">
${companyHeaderHtml()}
   ${goalContextHtml(payload, goalConfig, subGoalConfig)}
 <div class="max-w-5xl mx-auto bg-white rounded-[0.5rem] shadow-xl p-2">
   
  <!-- HERO (same as FE, static) -->
  <section class="bg-slate-900 text-white pt-8 pb-32">
    <div class="max-w-7xl mx-auto px-8">
      <h1 class="text-5xl font-serif font-bold">
        ${subGoalConfig.title}
      </h1>
      <p class="text-slate-400 mt-2 max-w-xl">
        ${subGoalConfig.description}
      </p>
    </div>
  </section>

  <!-- MAIN CARD -->
  <div class="max-w-7xl mx-auto px-8 -mt-32 pb-10">
    <div class="bg-white rounded-[2.5rem] shadow-2xl border flex flex-col lg:flex-row">
      <!-- RIGHT PANEL -->
      <div class="lg:w-5/12 bg-slate-900 p-5 md:p-8 text-white flex flex-col justify-between rounded-[2.5rem] rounded-[2.5rem] border-r border-slate-100">
        <div>
          <h3 class="text-xl font-bold mb-1">Projected Target</h3>
          <p class="text-slate-400 text-xs mb-6">
            AI-driven estimation based on inputs.
          </p>

          <div class="flex justify-center py-2">
            ${corpusCircleHtml(results.totalCorpus)}
          </div>

        ${results.monthlySIP
            ? `
  <div class="text-center mb-4">
    <div class="text-sm font-bold text-emerald-400 uppercase tracking-widest">
      Monthly SIP
    </div>
    <div class="text-3xl font-bold">
      ${formatIndianCurrency(results.monthlySIP, true)}
    </div>
  </div>`
            : ''
        }

${results.lumpsumRequired
            ? `
  <div class="text-center mb-4">
    <div class="text-sm font-bold text-emerald-400 uppercase tracking-widest">
      Lumpsum Required
    </div>
    <div class="text-3xl font-bold">
      ${formatIndianCurrency(results.lumpsumRequired, true)}
    </div>
  </div>`
            : ''
        }


          <div class="grid grid-cols-2 gap-4">
            ${(results.breakdown || [])
            .map(
                (b) => `
              <div class="bg-white/5 border border-white/10 p-3 rounded-xl">
                <p class="text-[10px] text-slate-400 uppercase font-bold">
                  ${b.label}
                </p>
                <p class="text-lg font-bold">${b.value}</p>
              </div>
            `
            )
            .join('')}
          </div>
        </div>

        <div class="text-center text-xs text-slate-500 mt-5 border-t border-white/10 pt-4">
          Report generated by Kanakdhara Investments.
        </div>
      </div>
    </div>
    <!-- LEFT PANEL -->
      <div class="lg:w-7/12 p-6 md:p-8 border-r border-slate-100">
        <h3 class="text-xl font-bold text-slate-900 mb-10">
          Your Inputs
        </h3>

        <div class="space-y-8">
          ${subGoalConfig.fields
            .map(f => renderFieldHtml(f, inputs[f.id]))
            .join('')}
        </div>
      </div>
  </div>
  <section class="py-8 bg-slate-50 text-center border-t border-slate-200">
  <div class="max-w-4xl mx-auto px-4 flex items-start gap-3 justify-center text-slate-500">
    <div class="mt-0.5 text-slate-400 text-sm">⚠</div>
    <p class="text-[11px] leading-relaxed text-left">
      <strong>Disclaimer:</strong>
      Past performance may or may not be sustained in future and is not a guarantee of any future returns.
      Please note that these calculators are for illustrations only and do not represent actual returns.
      Mutual Funds do not have a fixed rate of return and it is not possible to predict the rate of return.
      Mutual Fund investments are subject to market risks, read all scheme related documents carefully.
    </p>
  </div>
</section>
</div>

</body>
</html>
`;
}


module.exports = {
    generateGoalReportHtml,
    GOAL_REPORT_CONFIG
};