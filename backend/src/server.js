require("dotenv").config();

const jwtSecret = process.env.JWT_SECRET || "";
if (jwtSecret.length < 32 || jwtSecret === "replace_with_at_least_32_random_characters") {
  console.error("JWT_SECRET must be set to a private value containing at least 32 characters.");
  process.exit(1);
}

const app = require("./app");

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
