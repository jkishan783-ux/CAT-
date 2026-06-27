import fs from 'fs';
import csv from 'csv-parser';
import { SectionType, QuestionType, TestType } from '../models/Question';

export interface ParsedQuestion {
  groupId: string | null;
  passageText: string;
  section: SectionType;
  type: QuestionType;
  questionText: string;
  options: string[];
  correctAnswer: string;
  targetTestType: TestType;
  topic: string;
}

/**
 * Parses a CSV file containing questions.
 * Handles quoted fields containing commas, newlines, Markdown, and LaTeX.
 * 
 * CSV Header Format:
 * groupId,passageText,section,type,questionText,options,correctAnswer,targetTestType
 * 
 * Example Row:
 * "g1","Calculate $x$","QA","MCQ","If $$x^2=4$$, what is $$x$$?","2;-2;2 or -2;None","2 or -2","mock"
 */
export function parseQuestionsCSV(filePath: string): Promise<ParsedQuestion[]> {
  return new Promise((resolve, reject) => {
    const results: ParsedQuestion[] = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row: any) => {
        try {
          const section = (row.section || '').trim().toUpperCase();
          const type = (row.type || '').trim().toUpperCase();
          const targetTestType = (row.targetTestType || '').trim().toLowerCase();

          // Validation of enum types
          if (!['VARC', 'DILR', 'QA'].includes(section)) {
            throw new Error(`Invalid section: ${section}`);
          }
          if (!['MCQ', 'TITA'].includes(type)) {
            throw new Error(`Invalid question type: ${type}`);
          }
          if (!['mock', 'sectional', 'daily', 'interval'].includes(targetTestType)) {
            throw new Error(`Invalid target test type: ${targetTestType}`);
          }

          // Parse options separated by semicolon (e.g. "A;B;C;D")
          let options: string[] = [];
          if (type === 'MCQ' && row.options) {
            options = row.options
              .split(';')
              .map((opt: string) => opt.trim())
              .filter((opt: string) => opt.length > 0);
          }

          const parsedRow: ParsedQuestion = {
            groupId: row.groupId && row.groupId.trim() !== '' ? row.groupId.trim() : null,
            passageText: row.passageText ? row.passageText.trim() : '',
            section: section as SectionType,
            type: type as QuestionType,
            questionText: row.questionText ? row.questionText.trim() : '',
            options,
            correctAnswer: row.correctAnswer ? row.correctAnswer.trim() : '',
            targetTestType: targetTestType as TestType,
            topic: row.topic && row.topic.trim() !== '' ? row.topic.trim() : 'General',
          };

          results.push(parsedRow);
        } catch (err: any) {
          // Reject on any validation issue or row parsing failure
          reject(new Error(`CSV Parsing Error: ${err.message}. Row content: ${JSON.stringify(row)}`));
        }
      })
      .on('end', () => {
        resolve(results);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}
