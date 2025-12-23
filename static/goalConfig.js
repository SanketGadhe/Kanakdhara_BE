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
    'goal-retirement': {
        id: 'goal-retirement',
        title: 'Retirement Planning',
        description: 'Secure your second innings with precision planning.',
        heroImage: '/static/retirement.jpg',
        subGoals: [
            {
                id: 'comprehensive',
                title: 'Comprehensive Retirement Plan',
                description: 'Calculate exactly how much corpus and monthly SIP you need to maintain your lifestyle post-retirement.',
                icon: 'ShieldCheck',
                fields: [
                    { id: 'current_age', label: 'Current Age', type: 'years', min: 18, max: 60, step: 1, defaultValue: 30 },
                    { id: 'retirement_age', label: 'Retirement Age', type: 'years', min: 40, max: 80, step: 1, defaultValue: 60 },
                    { id: 'life_expectancy', label: 'Life Expectancy', type: 'years', min: 60, max: 100, step: 1, defaultValue: 85 },
                    { id: 'current_expenses', label: 'Current Monthly Expenses', type: 'currency', min: 10000, max: 500000, step: 500, defaultValue: 50000 },
                    { id: 'inflation_rate', label: 'Expected Inflation (%)', type: 'percentage', min: 0, max: 12, step: 0.1, defaultValue: 6 },
                    { id: 'pre_retirement_return', label: 'Pre-Retirement Return (%)', type: 'percentage', min: 8, max: 25, step: 0.1, defaultValue: 14, disclaimer: "Indian equities (Nifty 50) have given approx. 14% returns over the last 20 years." },
                    { id: 'post_retirement_return', label: 'Post-Retirement Return (%)', type: 'percentage', min: 8, max: 25, step: 0.1, defaultValue: 8 },
                ],
                calculate: (vals) => {
                    // 1. Years to Retirement
                    const years_to_retirement = vals.retirement_age - vals.current_age;

                    // 2. Monthly Expenses at Retirement (FV of current expenses)
                    const expense_at_retirement = vals.current_expenses * Math.pow((1 + vals.inflation_rate / 100), years_to_retirement);

                    // 3. Corpus Required (PV of Annuity for retirement years adjusted for inflation)
                    const retirement_years = vals.life_expectancy - vals.retirement_age;

                    // Real rate of return formula: (1+nominal)/(1+inflation) - 1
                    const real_return = ((1 + vals.post_retirement_return / 100) / (1 + vals.inflation_rate / 100)) - 1;

                    const months_in_retirement = retirement_years * 12;
                    const monthly_real_return = real_return / 12;

                    // Corpus = Monthly Expense * [ (1 - (1+r)^-n) / r ]
                    // Using monthly real return for monthly drawdowns
                    const corpus_required = expense_at_retirement * ((1 - Math.pow(1 + monthly_real_return, -months_in_retirement)) / monthly_real_return);

                    // 4. Monthly SIP Required
                    // Rate for pre-retirement accumulation
                    const monthly_rate = vals.pre_retirement_return / 100 / 12;
                    const investment_months = years_to_retirement * 12;

                    // SIP Formula: P = FV / [ ( (1+i)^n - 1 ) / i * (1+i) ]
                    const monthly_sip = corpus_required / (((Math.pow(1 + monthly_rate, investment_months) - 1) / monthly_rate) * (1 + monthly_rate));

                    return {
                        totalCorpus: Math.round(corpus_required),
                        monthlySIP: Math.round(monthly_sip),
                        breakdown: [
                            { label: 'Years to Retire', value: `${years_to_retirement} Years` },
                            { label: 'Monthly Expense @ Ret.', value: formatIndianCurrency(Math.round(expense_at_retirement), true), tooltip: formatIndianCurrency(Math.round(expense_at_retirement)) },
                            { label: 'Retirement Duration', value: `${retirement_years} Years` }
                        ]
                    };
                }
            },
            {
                id: 'deferred-swp',
                title: 'Deferred SWP Calculator',
                description: 'Estimate how much income you can withdraw after allowing your investments to grow.',
                icon: 'TrendingUp',
                fields: [
                    { id: 'current_corpus', label: 'Current Corpus', type: 'currency', min: 100000, max: 50000000, step: 50000, defaultValue: 5000000 },
                    { id: 'growth_rate', label: 'Growth Rate Before SWP (%)', type: 'percentage', min: 6, max: 18, step: 0.5, defaultValue: 12 },
                    { id: 'defer_years', label: 'Years Before SWP Starts', type: 'years', min: 1, max: 30, step: 1, defaultValue: 10 },
                    { id: 'swp_rate', label: 'Return During SWP (%)', type: 'percentage', min: 4, max: 12, step: 0.5, defaultValue: 8 },
                    { id: 'swp_years', label: 'SWP Duration (Years)', type: 'years', min: 5, max: 40, step: 1, defaultValue: 25 }
                ],
                calculate: (vals) => {
                    // 1. Accumulated Corpus after deferment
                    const accumulatedCorpus =
                        vals.current_corpus * Math.pow(1 + vals.growth_rate / 100, vals.defer_years);

                    // 2. Monthly SWP calculation
                    const monthlyRate = vals.swp_rate / 100 / 12;
                    const months = vals.swp_years * 12;

                    const monthlySWP =
                        accumulatedCorpus * monthlyRate /
                        (1 - Math.pow(1 + monthlyRate, -months));

                    return {
                        accumulatedCorpus: Math.round(accumulatedCorpus),
                        monthlySWP: Math.round(monthlySWP),
                        breakdown: [
                            { label: 'Corpus at SWP Start', value: formatIndianCurrency(Math.round(accumulatedCorpus)) },
                            { label: 'SWP Duration', value: `${vals.swp_years} Years` },
                            { label: 'Monthly Income', value: formatIndianCurrency(Math.round(monthlySWP), true) }
                        ]
                    };
                }
            },
            {
                id: 'immediate-swp',
                title: 'Immediate SWP Calculator',
                description: 'Calculate sustainable monthly income from your existing retirement corpus.',
                icon: 'Wallet',
                fields: [
                    { id: 'accumulated_corpus', label: 'Current Retirement Corpus', type: 'currency', min: 500000, max: 100000000, step: 50000, defaultValue: 10000000 },
                    { id: 'swp_rate', label: 'Withdrawal Rate (%)', type: 'percentage', min: 4, max: 12, step: 0.5, defaultValue: 8 },
                    { id: 'swp_years', label: 'Withdrawal Period (Years)', type: 'years', min: 5, max: 40, step: 1, defaultValue: 25 }
                ],
                calculate: (vals) => {
                    const monthlyRate = vals.swp_rate / 100 / 12;
                    const months = vals.swp_years * 12;

                    const maxSWP =
                        vals.accumulated_corpus * monthlyRate /
                        (1 - Math.pow(1 + monthlyRate, -months));

                    return {
                        totalCorpus: vals.accumulated_corpus,
                        breakdown: [
                            { label: 'SWP Period', value: `${vals.swp_years} Years` },
                            { label: 'Monthly Income', value: formatIndianCurrency(Math.round(maxSWP), true) }
                        ]
                    };
                }
            },
            {
                id: 'portfolio-forecast',
                title: 'Portfolio Forecast',
                description: 'See how your retirement portfolio grows over time across multiple assets.',
                icon: 'PieChart',
                fields: [
                    { id: 'equity_amount', label: 'Equity Investment', type: 'currency', min: 0, max: 50000000, step: 10000, defaultValue: 1000000 },
                    { id: 'equity_rate', label: 'Equity Return (%)', type: 'percentage', min: 5, max: 25, step: 0.1, defaultValue: 14 },
                    { id: 'debt_amount', label: 'Debt Investment', type: 'currency', min: 0, max: 150000, step: 5000, defaultValue: 150000 },
                    { id: 'debt_rate', label: 'Debt Return (%)', type: 'percentage', min: 3, max: 25, step: 0.1, defaultValue: 7.1 },
                    { id: 'real_estate', label: 'Real Estate Investment', type: 'currency', min: 0, max: 50000000, step: 10000, defaultValue: 500000 },
                    { id: 'real_estate_rate', label: 'Real Estate Return (%)', type: 'percentage', min: 2, max: 25, step: 0.1, defaultValue: 6 },
                    { id: 'gold_amount', label: 'Gold Investment', type: 'currency', min: 0, max: 50000000, step: 10000, defaultValue: 500000 },
                    { id: 'gold_rate', label: 'Gold Return (%)', type: 'percentage', min: 2, max: 25, step: 0.1, defaultValue: 8 },
                    { id: 'other_amount', label: 'Other Investment', type: 'currency', min: 0, max: 50000000, step: 10000, defaultValue: 0 },
                    { id: 'other_rate', label: 'Other Return (%)', type: 'percentage', min: 2, max: 25, step: 0.1, defaultValue: 5 }
                ],

                calculate: (vals) => {
                    const years = [5, 10, 15, 20, 25, 30];

                    const forecast = years.map(y => {
                        const debt =
                            vals.debt_amount * ((Math.pow(1 + vals.debt_rate / 100, y) - 1) / (vals.debt_rate / 100));

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
                            total: Math.round(debt + equityFVTotal + otherFV + goldFV + realEstateFV)
                        };
                    });

                    // const latestTotal = forecast[forecast.length - 1]?.total || 0;
                    const maxYears = Math.max(...years);
                    // const months = maxYears * 12;

                    // const monthlyRate = (vals.equity_rate || 0) / 100 / 12;
                    return {
                        forecast,
                        totalCorpus: forecast[forecast.length - 1]?.total || 0,
                        breakdown: forecast.map(f => ({
                            label: `${f.year} Years`,
                            value: formatIndianCurrency(f.total, true),
                            tooltip: formatIndianCurrency(f.total)
                        }))
                    };
                }
            }
        ]
    },
    'goal-investment': {
        id: 'investment-planning',
        title: 'Investment Planning',
        description: 'Build wealth systematically using SIPs and smart allocations.',
        heroImage: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e',
        subGoals: [
            {
                id: 'sip-lumpsum',
                title: 'SIP + Lumpsum Projection',
                description: 'Project future value of SIP and Lumpsum investments.',
                icon: 'TrendingUp',
                fields: [
                    { id: 'sip', label: 'Monthly SIP', type: 'currency', min: 1000, max: 500000, step: 500, defaultValue: 10000 },
                    { id: 'lumpsum', label: 'Lumpsum Investment', type: 'currency', min: 0, max: 50000000, step: 10000, defaultValue: 500000 },
                    { id: 'years', label: 'Duration (Years)', type: 'years', min: 1, max: 40, step: 1, defaultValue: 15 },
                    { id: 'rate', label: 'Expected Return (%)', type: 'percentage', min: 8, max: 20, step: 0.5, defaultValue: 14 }
                ],
                calculate: (v) => {
                    const r = v.rate / 100 / 12;
                    const n = v.years * 12;

                    const sipFV = v.sip * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
                    const lumpFV = v.lumpsum * Math.pow(1 + r, n);

                    return {
                        totalCorpus: Math.round(sipFV + lumpFV),
                        monthlySIP: v.sip,
                        breakdown: [
                            { label: 'SIP Value', value: formatIndianCurrency(Math.round(sipFV), true) },
                            { label: 'Lumpsum Value', value: formatIndianCurrency(Math.round(lumpFV), true) }
                        ]
                    };
                }
            },
            {
                id: 'stepup-sip',
                title: 'Step-Up SIP Planner',
                description: 'SIP with annual top-up in absolute ₹ terms plus Lumpsum.',
                icon: 'ArrowUp',
                fields: [
                    { id: 'sip_start', label: 'Starting SIP', type: 'currency', min: 1000, max: 200000, step: 500, defaultValue: 10000 },
                    { id: 'lumpsum', label: 'Lumpsum Investment', type: 'currency', min: 0, max: 50000000, step: 10000, defaultValue: 500000 },
                    { id: 'stepup', label: 'Annual Step-Up (%)', type: 'percentage', min: 0, max: 100, step: 1, defaultValue: 10 },
                    { id: 'years', label: 'Duration', type: 'years', min: 1, max: 40, step: 1, defaultValue: 20 },
                    { id: 'rate', label: 'Expected Return (%)', type: 'percentage', min: 8, max: 18, step: 0.5, defaultValue: 14 }
                ],
                calculate: (v) => {
                    const r = v.rate / 100 / 12;
                    const totalMonths = v.years * 12;

                    /* -------- STEP-UP SIP FV -------- */
                    let sipFV = 0;
                    let totalSipInvested = 0;

                    for (let y = 1; y <= v.years; y++) {
                        const sipAmount = v.sip_start + (y - 1) * (v.stepup / 100) * v.sip_start;
                        totalSipInvested += sipAmount * 12;

                        const monthsLeft = (v.years - y + 1) * 12;

                        const fvYear =
                            sipAmount *
                            ((Math.pow(1 + r, 12) - 1) / r) *
                            Math.pow(1 + r, monthsLeft - 12);

                        sipFV += fvYear;
                    }

                    /* -------- LUMPSUM FV -------- */
                    const lumpsumFV =
                        v.lumpsum > 0
                            ? v.lumpsum * Math.pow(1 + r, totalMonths)
                            : 0;

                    /* -------- TOTAL CORPUS -------- */
                    const totalCorpus = sipFV + lumpsumFV;

                    return {
                        totalCorpus: Math.round(totalCorpus),
                        breakdown: [
                            {
                                label: 'Total SIP Invested',
                                value: formatIndianCurrency(Math.round(totalSipInvested), true),
                                tooltip: formatIndianCurrency(Math.round(totalSipInvested))
                            },
                            {
                                label: 'SIP Value',
                                value: formatIndianCurrency(Math.round(sipFV), true),
                                tooltip: formatIndianCurrency(Math.round(sipFV))
                            },
                            {
                                label: 'Lumpsum Value',
                                value: formatIndianCurrency(Math.round(lumpsumFV), true),
                                tooltip: formatIndianCurrency(Math.round(lumpsumFV))
                            }
                        ]
                    };
                }
            },
            {
                id: 'crorepati',
                title: 'Crorepati Calculator',
                description: 'Know how long it takes to reach your first crore.',
                icon: 'Crown',
                fields: [
                    { id: 'sip', label: 'Monthly SIP', type: 'currency', min: 5000, max: 500000, step: 500, defaultValue: 15000 },
                    { id: 'target', label: 'Target (₹ Crores)', type: 'number', min: 1, max: 10, step: 1, defaultValue: 1 },
                    { id: 'rate', label: 'Expected Return (%)', type: 'percentage', min: 8, max: 18, step: 0.5, defaultValue: 14 }
                ],
                calculate: (v) => {
                    const target = v.target * 10000000;
                    const r = v.rate / 100 / 12;
                    let corpus = 0;
                    let months = 0;

                    while (corpus < target && months < 1000) {
                        corpus = corpus * (1 + r) + v.sip;
                        months++;
                    }

                    return {
                        totalCorpus: Math.round(corpus),
                        monthlySIP: v.sip,
                        breakdown: [
                            { label: 'Time Required', value: `${Math.floor(months / 12)} Years ${months % 12} Months` }
                        ]
                    };
                }
            },
            {
                id: 'lumpsum-cagr',
                title: 'Lumpsum CAGR Calculator',
                description: 'Calculate CAGR for a one-time investment.',
                icon: 'Percent',
                fields: [
                    {
                        id: 'invested',
                        label: 'Investment Amount',
                        type: 'currency',
                        min: 10000,
                        defaultValue: 500000
                    },
                    {
                        id: 'years',
                        label: 'Investment Period (Years)',
                        type: 'years',
                        min: 1,
                        defaultValue: 5
                    },
                    {
                        id: 'current',
                        label: 'Current Value',
                        type: 'currency',
                        min: 10000,
                        defaultValue: 850000
                    }
                ],

                calculate: (v) => {
                    /* ---------- Build Cash Flows ---------- */
                    const startDate = new Date(0); // epoch
                    const endDate = new Date(v.years * 365 * 24 * 60 * 60 * 1000);

                    const cashFlows = [
                        { date: startDate, amount: -v.invested },
                        { date: endDate, amount: v.current }
                    ];

                    /* ---------- XNPV ---------- */
                    const xnpv = (rate) => {
                        const t0 = cashFlows[0].date.getTime();
                        return cashFlows.reduce((sum, cf) => {
                            const days =
                                (cf.date.getTime() - t0) / (1000 * 60 * 60 * 24);
                            return sum + cf.amount / Math.pow(1 + rate, days / 365);
                        }, 0);
                    };

                    /* ---------- dXNPV ---------- */
                    const dxnpv = (rate) => {
                        const t0 = cashFlows[0].date.getTime();
                        return cashFlows.reduce((sum, cf) => {
                            const days =
                                (cf.date.getTime() - t0) / (1000 * 60 * 60 * 24);
                            const exp = days / 365;
                            return sum - (exp * cf.amount) / Math.pow(1 + rate, exp + 1);
                        }, 0);
                    };

                    /* ---------- Newton–Raphson ---------- */
                    let rate = 0.1; // 10% initial guess
                    const precision = 1e-7;
                    const maxIter = 100;

                    for (let i = 0; i < maxIter; i++) {
                        const npv = xnpv(rate);
                        const dnpv = dxnpv(rate);

                        if (Math.abs(dnpv) < 1e-10) break;

                        const newRate = rate - npv / dnpv;

                        if (Math.abs(newRate - rate) < precision) {
                            rate = newRate;
                            break;
                        }

                        rate = newRate;
                    }

                    return {
                        totalCorpus: Math.round(rate * 10000) / 100 // CAGR %
                    };
                }
            }
        ]
    },

    'goal-insurance': {
        id: 'insurance-planning',
        title: 'Insurance Planning',
        description: 'Protect your family against financial uncertainty.',
        heroImage: 'https://images.unsplash.com/photo-1605902711622-cfb43c44367f',
        subGoals: [

            /* ======================================================
               OPTION 1 — EXPENSE BASED INSURANCE REQUIREMENT
               ====================================================== */
            {
                id: 'expense-based-hlv',
                title: 'Expense-Based Life Insurance',
                description: 'Goal-based insurance requirement using household expenses.',
                icon: 'Shield',
                fields: [
                    { id: 'age', label: 'Current Age', type: 'years', min: 18, max: 65, step: 1, defaultValue: 35 },
                    { id: 'dependency_years', label: 'Years Dependents Need Support', type: 'years', min: 1, max: 40, step: 1, defaultValue: 25 },

                    { id: 'monthly_expense', label: 'Monthly Household Expense', type: 'currency', min: 10000, max: 300000, step: 5000, defaultValue: 60000 },
                    { id: 'expense_inflation', label: 'Expense Inflation (%)', type: 'percentage', min: 3, max: 8, step: 0.5, defaultValue: 6 },

                    { id: 'return_rate', label: 'Expected Return on Corpus (%)', type: 'percentage', min: 4, max: 10, step: 0.5, defaultValue: 6 },

                    { id: 'goal_lumpsum', label: 'Future Family Goals (Optional)', type: 'currency', min: 0, max: 50000000, step: 100000, defaultValue: 0 },
                    { id: 'goal_years', label: 'Years to Goal', type: 'years', min: 0, max: 25, step: 1, defaultValue: 0 },

                    { id: 'existing_cover', label: 'Existing Life Cover', type: 'currency', min: 0, max: 50000000, step: 500000, defaultValue: 5000000 },
                    { id: 'existing_assets', label: 'Existing Liquid Assets', type: 'currency', min: 0, max: 50000000, step: 500000, defaultValue: 2000000 },
                    { id: 'liabilities', label: 'Outstanding Liabilities', type: 'currency', min: 0, max: 50000000, step: 500000, defaultValue: 10000000 }
                ],

                calculate: (v) => {
                    const I = v.expense_inflation / 100;
                    const R = v.return_rate / 100;
                    const Y = v.dependency_years;

                    /* ---- Present Value of Inflation-adjusted Expenses ---- */
                    let pvExpenses = 0;
                    for (let t = 1; t <= Y; t++) {
                        const annualExpense =
                            v.monthly_expense * 12 * Math.pow(1 + I, t);
                        pvExpenses += annualExpense / Math.pow(1 + R, t);
                    }

                    /* ---- Lumpsum Goals (Optional) ---- */
                    let pvGoals = 0;
                    if (v.goal_lumpsum > 0 && v.goal_years > 0) {
                        const fvGoal =
                            v.goal_lumpsum * Math.pow(1 + I, v.goal_years);
                        pvGoals = fvGoal / Math.pow(1 + R, v.goal_years);
                    }

                    /* ---- Total Insurance Required ---- */
                    const insuranceRequired =
                        pvExpenses +
                        pvGoals +
                        v.liabilities -
                        v.existing_assets;

                    const gap =
                        insuranceRequired - v.existing_cover;

                    return {
                        totalCorpus: Math.round(insuranceRequired),
                        breakdown: [
                            { label: 'Expense Corpus', value: formatIndianCurrency(Math.round(pvExpenses)) },
                            { label: 'Goals Corpus', value: formatIndianCurrency(Math.round(pvGoals)) },
                            { label: "Existing Cover", value: formatIndianCurrency(v.existing_cover) },
                            { label: "Additional Cover Required", value: formatIndianCurrency(Math.max(0, Math.round(gap))) }
                        ],
                    };
                }
            },

            /* ======================================================
               OPTION 2 — INCOME BASED HLV (CLASSICAL MODEL)
               ====================================================== */
            {
                id: 'income-based-hlv',
                title: 'Income-Based Life Insurance (HLV)',
                description: 'Classical Human Life Value model for income earners.',
                icon: 'TrendingUp',
                fields: [
                    { id: 'current_age', label: 'Current Age', type: 'years', min: 18, max: 60, step: 1, defaultValue: 35 },
                    { id: 'retirement_age', label: 'Retirement Age', type: 'years', min: 45, max: 70, step: 1, defaultValue: 60 },

                    { id: 'annual_income', label: 'Annual Income', type: 'currency', min: 200000, max: 50000000, step: 100000, defaultValue: 1800000 },
                    { id: 'family_contribution', label: 'Income Contributed to Family (%)', type: 'percentage', min: 40, max: 100, step: 5, defaultValue: 70 },

                    { id: 'income_growth', label: 'Income Growth (%)', type: 'percentage', min: 0, max: 10, step: 0.5, defaultValue: 5 },
                    { id: 'discount_rate', label: 'Expected Return / Discount Rate (%)', type: 'percentage', min: 4, max: 10, step: 0.5, defaultValue: 6 },

                    { id: 'existing_cover', label: 'Existing Life Cover', type: 'currency', min: 0, max: 50000000, step: 500000, defaultValue: 5000000 },
                    { id: 'existing_assets', label: 'Existing Assets', type: 'currency', min: 0, max: 50000000, step: 500000, defaultValue: 3000000 },
                    { id: 'liabilities', label: 'Outstanding Liabilities', type: 'currency', min: 0, max: 50000000, step: 500000, defaultValue: 12000000 }
                ],

                calculate: (v) => {
                    const years =
                        v.retirement_age - v.current_age;
                    const G = v.income_growth / 100;
                    const R = v.discount_rate / 100;
                    const C = v.family_contribution / 100;

                    let pvIncome = 0;

                    for (let t = 1; t <= years; t++) {
                        const income =
                            v.annual_income * Math.pow(1 + G, t);
                        const familyIncome = income * C;
                        pvIncome += familyIncome / Math.pow(1 + R, t);
                    }

                    const insuranceRequired =
                        pvIncome +
                        v.liabilities -
                        v.existing_assets;

                    const gap =
                        insuranceRequired - v.existing_cover;

                    return {
                        totalCorpus: Math.round(insuranceRequired),
                        breakdown: [
                            { label: 'Human Life Value', value: formatIndianCurrency(Math.round(pvIncome)) },
                            { label: 'Existing Cover', value: formatIndianCurrency(v.existing_cover) },
                            { label: 'Additional Cover Required', value: formatIndianCurrency(Math.max(0, Math.round(gap))) }
                        ],
                    };
                }
            }
        ]
    },

    'goal-travel': {
        id: 'dream-travel',
        title: 'Dream Travel Planning',
        description: 'Plan your dream vacation stress-free.',
        heroImage: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee',
        subGoals: [

            {
                id: 'travel-sip',
                title: 'Travel SIP Planner',
                description: 'Monthly SIP for your dream travel.',
                icon: 'Plane',
                fields: [
                    { id: 'budget', label: 'Travel Budget', type: 'currency', min: 100000, max: 10000000, step: 50000, defaultValue: 500000 },
                    { id: 'years', label: 'Time Horizon', type: 'years', min: 1, max: 10, step: 1, defaultValue: 3 },
                    { id: 'rate', label: 'Expected Return (%)', type: 'percentage', min: 6, max: 14, step: 0.5, defaultValue: 10 }
                ],
                calculate: (v) => {
                    const r = v.rate / 100 / 12;
                    const n = v.years * 12;
                    const sip = v.budget / (((Math.pow(1 + r, n) - 1) / r) * (1 + r));
                    return { monthlySIP: Math.round(sip) };
                }
            }
        ]
    },
    /* ===================== OTHER LIFE GOALS ===================== */
    'goal-others': {
        id: 'other-goals',
        title: 'Other Life Goals',
        description: 'Plan important financial milestones across life stages.',
        heroImage: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1',
        subGoals: [

            /* ================= CHILD EDUCATION ================= */
            {
                id: 'child-education',
                title: 'Child Education Planning',
                description: 'Plan higher education expenses with inflation adjustment.',
                icon: 'GraduationCap',
                fields: [
                    { id: 'cost_today', label: 'Education Cost Today', type: 'currency', min: 0, max: 100000000, step: 100000, defaultValue: 3000000 },
                    { id: 'inflation', label: 'Education Inflation (%)', type: 'percentage', min: 0, max: 12, step: 0.1, defaultValue: 6 },
                    { id: 'years', label: 'Years to Goal', type: 'years', min: 1, max: 30, step: 1, defaultValue: 15 },
                    { id: 'rate', label: 'Expected Return (%)', type: 'percentage', min: 5, max: 25, step: 0.1, defaultValue: 12 }
                ],
                calculate: (v) => {
                    const fv = v.cost_today * Math.pow(1 + v.inflation / 100, v.years);
                    const r = v.rate / 100 / 12;
                    const n = v.years * 12;

                    const sip = fv * r / (Math.pow(1 + r, n) - 1);
                    const lumpsum = fv / Math.pow(1 + v.rate / 100, v.years);

                    return {
                        totalCorpus: Math.round(fv),
                        monthlySIP: Math.round(sip),
                        lumpsumRequired: Math.round(lumpsum)
                    };
                }
            },

            /* ================= CHILD MARRIAGE ================= */
            {
                id: 'child-marriage',
                title: 'Marriage Planning',
                description: 'Prepare financially for marriage expenses with inflation.',
                icon: 'Heart',
                fields: [
                    { id: 'cost_today', label: 'Marriage Cost Today', type: 'currency', min: 500000, max: 50000000, step: 100000, defaultValue: 2000000 },
                    { id: 'inflation', label: 'Marriage Inflation (%)', type: 'percentage', min: 0, max: 12, step: 0.1, defaultValue: 6 },
                    { id: 'years', label: 'Years to Goal', type: 'years', min: 1, max: 25, step: 1, defaultValue: 18 },
                    { id: 'rate', label: 'Expected Return (%)', type: 'percentage', min: 5, max: 25, step: 0.5, defaultValue: 11 }
                ],
                calculate: (v) => {
                    const fv = v.cost_today * Math.pow(1 + v.inflation / 100, v.years);
                    const r = v.rate / 100 / 12;
                    const n = v.years * 12;

                    const sip = fv * r / (Math.pow(1 + r, n) - 1);
                    const lumpsum = fv / Math.pow(1 + v.rate / 100, v.years);

                    return {
                        totalCorpus: Math.round(fv),
                        monthlySIP: Math.round(sip),
                        lumpsumRequired: Math.round(lumpsum)
                    };
                }
            },

            /* ================= EMERGENCY FUND ================= */
            {
                id: 'emergency-fund',
                title: 'Emergency Fund Planning',
                description: 'Build a liquid emergency buffer (no market risk).',
                icon: 'AlertTriangle',
                fields: [
                    { id: 'monthly_expense', label: 'Monthly Expense', type: 'currency', min: 10000, max: 5000000, step: 5000, defaultValue: 50000 },
                    { id: 'months', label: 'Emergency Coverage (Months)', type: 'number', min: 3, max: 36, step: 1, defaultValue: 6 },
                    { id: "optionalSpending", label: "Optional Spending (%)", type: "percentage", min: 0, max: 50, step: 0.1, defaultValue: 10 }
                ],
                calculate: (v) => {
                    const corpus = v.monthly_expense * v.months * (1 - v.optionalSpending / 100);
                    return {
                        totalCorpus: Math.round(corpus)
                    };
                }
            },

            /* ================= HOME PURCHASE ================= */
            {
                id: 'home-purchase',
                title: 'Home Purchase Planning',
                description: 'Plan down payment for your dream home.',
                icon: 'Home',
                fields: [
                    { id: 'down_payment', label: 'Down Payment Required', type: 'currency', min: 500000, max: 50000000, step: 100000, defaultValue: 2500000 },
                    { id: 'years', label: 'Years to Buy', type: 'years', min: 1, max: 25, step: 1, defaultValue: 5 },
                    { id: 'rate', label: 'Expected Return (%)', type: 'percentage', min: 5, max: 25, step: 0.1, defaultValue: 10 }
                ],
                calculate: (v) => {
                    const r = v.rate / 100 / 12;
                    const n = v.years * 12;

                    const sip = v.down_payment * r / (Math.pow(1 + r, n) - 1);
                    const lumpsum = v.down_payment / Math.pow(1 + v.rate / 100, v.years);

                    return {
                        monthlySIP: Math.round(sip),
                        lumpsumRequired: Math.round(lumpsum),
                        totalCorpus: v.down_payment
                    };
                }
            },

            /* ================= CAR PURCHASE ================= */
            {
                id: 'car-purchase',
                title: 'Car Purchase Planning',
                description: 'Save smartly for your next car.',
                icon: 'Car',
                fields: [
                    { id: 'car_cost', label: 'Car Cost', type: 'currency', min: 100000, max: 50000000, step: 50000, defaultValue: 1000000 },
                    { id: 'years', label: 'Years to Buy', type: 'years', min: 1, max: 25, step: 1, defaultValue: 3 },
                    { id: 'rate', label: 'Expected Return (%)', type: 'percentage', min: 5, max: 25, step: 0.1, defaultValue: 9 }
                ],
                calculate: (v) => {
                    const r = v.rate / 100 / 12;
                    const n = v.years * 12;

                    const sip = v.car_cost * r / (Math.pow(1 + r, n) - 1);
                    const lumpsum = v.car_cost / Math.pow(1 + v.rate / 100, v.years);

                    return {
                        monthlySIP: Math.round(sip),
                        lumpsumRequired: Math.round(lumpsum),
                        totalCorpus: v.car_cost
                    };
                }
            },

            /* ================= WEALTH CREATION ================= */
            {
                id: 'wealth-creation',
                title: 'Wealth Creation Goal',
                description: 'Long-term disciplined wealth accumulation.',
                icon: 'TrendingUp',
                fields: [
                    { id: 'target', label: 'Target Amount', type: 'currency', min: 1000000, max: 100000000, step: 500000, defaultValue: 50000000 },
                    { id: 'years', label: 'Time Horizon', type: 'years', min: 5, max: 40, step: 1, defaultValue: 20 },
                    { id: 'rate', label: 'Expected Return (%)', type: 'percentage', min: 5, max: 25, step: 0.1, defaultValue: 14 }
                ],
                calculate: (v) => {
                    const r = v.rate / 100 / 12;
                    const n = v.years * 12;

                    const sip = v.target * r / (Math.pow(1 + r, n) - 1);
                    const lumpsum = v.target / Math.pow(1 + v.rate / 100, v.years);

                    return {
                        monthlySIP: Math.round(sip),
                        lumpsumRequired: Math.round(lumpsum),
                        totalCorpus: v.target
                    };
                }
            },

            /* ================= LEGACY GOAL ================= */
            {
                id: 'legacy-goal',
                title: 'Legacy / Estate Goal',
                description: 'Create wealth for the next generation.',
                icon: 'ShieldCheck',
                fields: [
                    { id: 'target', label: 'Legacy Amount', type: 'currency', min: 10000000, max: 500000000, step: 1000000, defaultValue: 100000000 },
                    { id: 'years', label: 'Years to Build', type: 'years', min: 10, max: 40, step: 1, defaultValue: 25 },
                    { id: 'rate', label: 'Expected Return (%)', type: 'percentage', min: 5, max: 25, step: 0.1, defaultValue: 13 }
                ],
                calculate: (v) => {
                    const r = v.rate / 100 / 12;
                    const n = v.years * 12;

                    const sip = v.target * r / (Math.pow(1 + r, n) - 1);
                    const lumpsum = v.target / Math.pow(1 + v.rate / 100, v.years);

                    return {
                        monthlySIP: Math.round(sip),
                        lumpsumRequired: Math.round(lumpsum),
                        totalCorpus: v.target
                    };
                }
            }
        ]
    }

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


function corpusCircleHtml(value) {
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

    <div class="absolute text-center">
      <p class="text-brand-400 text-xs font-bold uppercase tracking-widest mb-2">
        Target Corpus
      </p>
      <h2 class="text-4xl font-serif font-bold text-white">
        ${formatIndianCurrency(value)}
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
 <div class="max-w-5xl mx-auto bg-white rounded-[2.5rem] shadow-xl p-2">
   ${companyHeaderHtml()}
   ${goalContextHtml(payload, goalConfig, subGoalConfig)}
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
                Monthly SIP Required
              </div>
              <div class="text-3xl font-bold">
                ${results.monthlySIP}
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
</div>
</body>
</html>
`;
}


module.exports = {
    generateGoalReportHtml,
    GOAL_REPORT_CONFIG
};