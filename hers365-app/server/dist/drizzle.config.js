export default {
    schema: "./schema.ts",
    out: "./drizzle",
    dialect: "sqlite",
    dbCredentials: {
        url: process.env.DATABASE_URL || "./hers365.sqlite",
    },
};
//# sourceMappingURL=drizzle.config.js.map