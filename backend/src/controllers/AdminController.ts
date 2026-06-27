import { Response } from 'express';
import fs from 'fs';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import Question from '../models/Question';
import { parseQuestionsCSV } from '../utils/csvParser';

/**
 * POST /api/admin/upload-questions
 * Bulk uploads questions via CSV. Protected by admin check.
 */
export async function uploadQuestions(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No CSV file was uploaded.' });
    }

    const filePath = req.file.path;

    try {
      // 1. Parse CSV Questions
      const questions = await parseQuestionsCSV(filePath);

      if (questions.length === 0) {
        // Delete temp file and return
        fs.unlinkSync(filePath);
        return res.status(400).json({ error: 'The uploaded CSV file contains no valid question rows.' });
      }

      // 2. Bulk Insert to MongoDB
      const result = await Question.insertMany(questions);

      // 3. Remove temp upload file
      fs.unlinkSync(filePath);

      return res.status(201).json({
        message: 'Questions uploaded and parsed successfully.',
        count: result.length,
      });
    } catch (parseError: any) {
      // Cleanup temp file in case of error
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return res.status(400).json({
        error: 'Failed to process CSV file.',
        details: parseError.message,
      });
    }
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
