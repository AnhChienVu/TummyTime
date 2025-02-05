const fs = require("fs");
const path = require("path");
const pool = require("../../../../database/db");
const formidable = require("formidable");

module.exports.config = {
  api: {
    bodyParser: false,
  },
};

module.exports = async (req, res) => {
  const form = new formidable.IncomingForm();
  form.uploadDir = path.join(process.cwd(), "public/uploads");
  form.keepExtensions = true;

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Formidable error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    try {
      // Extract the first element from each array in fields
      const { user_id, title, text, date } = Object.fromEntries(
        Object.entries(fields).map(([key, value]) => [key, value[0]])
      );

      const image = files.image
        ? `/uploads/${path.basename(files.image[0].filepath)}`
        : null;

      // Convert user_id to an integer
      const userIdInt = parseInt(user_id, 10);

      const journalEntry = await pool.query(
        "INSERT INTO journalentry (user_id, title, text, image, date) VALUES ($1, $2, $3, $4, $5) RETURNING *",
        [userIdInt, title, text, image, date]
      );

      return res.json(journalEntry.rows[0]);
    } catch (error) {
      console.error("Database query error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
};
