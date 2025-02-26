const pool = require("../../../../database/db");
const formidable = require("formidable");
const { getUserId } = require("../../../utils/userIdHelper");
const logger = require("../../../utils/logger");

// Validation constants
const MAX_TITLE_LENGTH = 255;
const MAX_TEXT_LENGTH = 10000;

module.exports.config = {
  api: { bodyParser: false },
};

module.exports = async (req, res) => {
  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) {
      logger.error("Form parsing error:", {
        error: err.message,
        stack: err.stack,
        code: err.code,
      });
      return res.status(500).json({ error: "Error processing form data" });
    }

    try {
      // Validate and sanitize inputs
      const { title, text, date } = Object.fromEntries(
        Object.entries(fields).map(([key, value]) => [key, value[0]])
      );

      // Input validation
      const validationErrors = [];

      if (!title?.trim()) validationErrors.push("Title is required");
      else if (title.length > MAX_TITLE_LENGTH)
        validationErrors.push(
          `Title must be ${MAX_TITLE_LENGTH} characters or less`
        );

      if (!text?.trim()) validationErrors.push("Text content is required");
      else if (text.length > MAX_TEXT_LENGTH)
        validationErrors.push(
          `Text must be ${MAX_TEXT_LENGTH} characters or less`
        );

      if (!date) validationErrors.push("Date is required");
      else if (isNaN(new Date(date).getTime()))
        validationErrors.push("Invalid date format");

      if (validationErrors.length > 0) {
        logger.warn("Validation failed for journal entry:", {
          errors: validationErrors,
          fields: {
            hasTitle: !!title?.trim(),
            hasText: !!text?.trim(),
            hasDate: !!date,
          },
        });
        return res.status(400).json({ errors: validationErrors });
      }

      const userId = getUserId(req);
      if (!userId) {
        logger.warn("User not found when creating journal entry", {
          hasTitle: !!title?.trim(),
          hasDate: !!date,
        });
        return res.status(401).json({ error: "User not authenticated" });
      }

      // Database operation
      const journalEntry = await pool.query(
        "INSERT INTO journalentry (user_id, title, text, date) VALUES ($1, $2, $3, $4) RETURNING *",
        [userId, title.trim(), text.trim(), new Date(date).toISOString()]
      );

      if (!journalEntry?.rows?.[0]) {
        logger.error("Failed to create journal entry:", {
          userId,
          hasTitle: !!title?.trim(),
        });
        return res
          .status(500)
          .json({ error: "Failed to create journal entry" });
      }

      logger.info("Journal entry created successfully", {
        userId,
        entryId: journalEntry.rows[0].id,
        hasTitle: !!title?.trim(),
      });

      return res.status(201).json(journalEntry.rows[0]);
    } catch (error) {
      logger.error("Database error while creating journal entry:", {
        error: error.message,
        stack: error.stack,
        userId: getUserId(req),
        fields: {
          hasFields: !!fields,
        },
      });

      if (error.code === "23505") {
        return res.status(409).json({ error: "Duplicate entry" });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  });
};
