const mongoose = require("mongoose");
const { Schema, Document } = mongoose;


/* =========================
   Interfaces
========================= */

// export interface IReport extends Document {
//     reportType: "financial_health" | "risk_profile";

//     meta: {
//         source: string;
//         createdAt: Date;
//     };

//     customerInfo: {
//         name: string;
//         email: string;
//         phone: string;
//         age: number;
//     };

//     assessment: {
//         totalScore: number;
//         maxPossible: number;
//         profileLabel: string;
//         profileColor: string;

//         profileDescription?: string;
//         riskBucket?: number;
//         answers: number[];
//     };

//     financialHealthData?: {
//         keyInputs: {
//             age?: number;
//             emergencyFund?: string;
//             saving?: string;
//             marketInvestment?: string;
//         };
//         investorPersona?: string;
//         actionCanBeTaken?: string;
//     };

//     riskProfileData?: {
//         allocation: {
//             ageGroup: string;
//             equity: number;
//             debt: number;
//             gold: number;
//             cash: number;
//         };
//         keyInputData: {
//             age: number;
//             horizon: number;
//             knowledge: number;
//             dependents: number;
//         };
//         notes?: {
//             recommendationSource?: string;
//         };
//     };
// }

/* =========================
   Schemas
========================= */

const MetaSchema = new Schema(
    {
        source: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    },
    { _id: false }
);


const AssessmentSchema = new Schema(
    {
        totalScore: { type: Number, required: true },
        maxPossible: { type: Number, required: true },
        profileLabel: { type: String, required: true },
        profileColor: { type: String, required: true },
        profileDescription: { type: String },
        riskBucket: { type: Number },
        answers: { type: [Number], required: true }
    },
    { _id: false }
);

const FinancialHealthSchema = new Schema(
    {
        keyInputs: {
            age: Number,
            emergencyFund: String,
            saving: String,
            marketInvestment: String
        },
        investorPersona: String,
        actionCanBeTaken: String
    },
    { _id: false }
);

const RiskProfileSchema = new Schema(
    {
        allocation: {
            ageGroup: String,
            equity: Number,
            debt: Number,
            gold: Number,
            cash: Number
        },
        keyInputData: {
            age: Number,
            horizon: String,
            knowledge: String,
            dependents: String
        },
        notes: {
            recommendationSource: String
        }
    },
    { _id: false }
);

const ReportSchema = new Schema(
    {
        reportType: {
            type: String,
            enum: ["financial_health", "risk_profile"],
            required: true
        },

        meta: MetaSchema,
        customerInfo: {
            ref: "CustomerInfo",
            type: Schema.Types.ObjectId,
            required: true
        },
        assessment: AssessmentSchema,
        financialHealthData: FinancialHealthSchema,
        riskProfileData: RiskProfileSchema
    },
    {
        timestamps: true
    }
);
const ReportModel = mongoose.model('Report', ReportSchema);
module.exports = ReportModel;