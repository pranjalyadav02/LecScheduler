module.exports = async (req, res) => {
    if (typeof global.DOMMatrix === 'undefined') {
        global.DOMMatrix = class DOMMatrix {
            constructor() {
                this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0;
            }
        };
    }

    try {
        const admin = require('./lib/firebase-admin');
        const pdfParse = require('pdf-parse');
        const hasServiceAccount = !!process.env.FIREBASE_SERVICE_ACCOUNT;
        const nodeVersion = process.version;

        return res.status(200).json({
            status: 'ok',
            message: 'Lecture Scheduler API is reachable.',
            diagnostics: {
                hasServiceAccount,
                nodeVersion,
                firebaseInitialized: admin.apps.length > 0,
                hasGeminiKey: !!process.env.GEMINI_API_KEY,
                pdfParseType: typeof pdfParse,
                pdfParseKeys: Object.keys(pdfParse),
                isFunction: typeof (typeof pdfParse === 'function' ? pdfParse : (pdfParse.PDFParse || pdfParse.default)) === 'function',
                detectsClass: (typeof pdfParse !== 'function' && (pdfParse.PDFParse || pdfParse.default)) ? true : false,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'Health check failed during initialization.',
            error: error.message,
            stack: error.stack
        });
    }
};
