import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import Question from '../models/Question';
import { parseQuestionsCSV } from '../utils/csvParser';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cat_prep';

function escapeCSVCell(val: string | null | undefined): string {
  if (val === null || val === undefined) return '""';
  const stringified = String(val);
  const escaped = stringified.replace(/"/g, '""');
  return `"${escaped}"`;
}

async function seed() {
  const tempCsvPath = path.join(__dirname, 'questions_temp.csv');

  // Define column headers
  const headers = ['groupId', 'passageText', 'section', 'type', 'questionText', 'options', 'correctAnswer', 'targetTestType'];

  // Define dataset rows
  const rows = [
    // 1. Reading Comprehension (RC) Set - 3 questions sharing the same groupId "rc_set_1"
    [
      'rc_set_1',
      'The emergence of digital platforms has fundamentally altered the economics of information. In the classical model, publisher-gatekeepers controlled distribution channels, capturing rents by bundle-pricing articles, advertisements, and physical logistics. Digital distribution collapsed these distribution costs to near zero, disintermediating traditional networks. While this democratized access to raw information, it led to a hyper-fragmentation of attention markets. Attention, rather than information, became the scarce economic resource, driving platforms to optimize for engagement heuristics that often favor sensationalism over analytical rigor.',
      'VARC',
      'MCQ',
      'Which of the following best states the primary thesis of the passage?',
      'Democratization of information has made traditional print media completely obsolete.;The scarcity of attention in digital networks has transformed the economics and quality of published information.;Bundle-pricing was an inefficient rent-seeking behavior by publisher-gatekeepers.;Sensationalism is a necessary developmental phase in digital attention markets.',
      'The scarcity of attention in digital networks has transformed the economics and quality of published information.',
      'mock'
    ],
    [
      'rc_set_1',
      'The emergence of digital platforms has fundamentally altered the economics of information. In the classical model, publisher-gatekeepers controlled distribution channels, capturing rents by bundle-pricing articles, advertisements, and physical logistics. Digital distribution collapsed these distribution costs to near zero, disintermediating traditional networks. While this democratized access to raw information, it led to a hyper-fragmentation of attention markets. Attention, rather than information, became the scarce economic resource, driving platforms to optimize for engagement heuristics that often favor sensationalism over analytical rigor.',
      'VARC',
      'MCQ',
      'According to the passage, the classical model of publishing captured rents primarily because:',
      'Publisher-gatekeepers controlled physical logistics and distribution channels.;Sensationalism was not a dominant factor in early print networks.;Attention was not yet a scarce resource in print economics.;Bundle-pricing was legally protected under monopolistic laws.',
      'Publisher-gatekeepers controlled physical logistics and distribution channels.',
      'mock'
    ],
    [
      'rc_set_1',
      'The emergence of digital platforms has fundamentally altered the economics of information. In the classical model, publisher-gatekeepers controlled distribution channels, capturing rents by bundle-pricing articles, advertisements, and physical logistics. Digital distribution collapsed these distribution costs to near zero, disintermediating traditional networks. While this democratized access to raw information, it led to a hyper-fragmentation of attention markets. Attention, rather than information, became the scarce economic resource, driving platforms to optimize for engagement heuristics that often favor sensationalism over analytical rigor.',
      'VARC',
      'MCQ',
      'The author implies that the transition to an "attention economy" has:',
      'Created an environment where in-depth analytical content is systematically de-prioritized by algorithms.;Forced digital platforms to return to a bundle-pricing model for advertisement streams.;Substantially lowered the production cost of premium journalism.;Empowered classical gatekeepers to regain market share.',
      'Created an environment where in-depth analytical content is systematically de-prioritized by algorithms.',
      'mock'
    ],

    // 2. Data Interpretation / Logical Reasoning (DILR) Set - 2 questions sharing the same groupId "dilr_set_1"
    [
      'dilr_set_1',
      'Five students (A, B, C, D, E) participated in a three-stage testing process for CAT Mock screening. The scoring grid lists their marks across VARC, DILR, and QA sections:\n\n| Candidate | VARC | DILR | QA |\n|---|---|---|---|\n| Candidate A | 88 | 92 | 80 |\n| Candidate B | 94 | 82 | 90 |\n| Candidate C | 76 | 96 | 78 |\n| Candidate D | 82 | 88 | 84 |\n| Candidate E | 90 | 90 | 92 |\n\nAdditional Rules:\n- The overall score is calculated as the simple sum of the three sectional scores.\n- Candidates are ranked by overall score. In case of a tie, the candidate with higher DILR score is ranked higher.',
      'DILR',
      'MCQ',
      'Which candidate achieved the highest overall score?',
      'Candidate A;Candidate B;Candidate D;Candidate E',
      'Candidate E',
      'mock'
    ],
    [
      'dilr_set_1',
      'Five students (A, B, C, D, E) participated in a three-stage testing process for CAT Mock screening. The scoring grid lists their marks across VARC, DILR, and QA sections:\n\n| Candidate | VARC | DILR | QA |\n|---|---|---|---|\n| Candidate A | 88 | 92 | 80 |\n| Candidate B | 94 | 82 | 90 |\n| Candidate C | 76 | 96 | 78 |\n| Candidate D | 82 | 88 | 84 |\n| Candidate E | 90 | 90 | 92 |\n\nAdditional Rules:\n- The overall score is calculated as the simple sum of the three sectional scores.\n- Candidates are ranked by overall score. In case of a tie, the candidate with higher DILR score is ranked higher.',
      'DILR',
      'MCQ',
      'What is the difference between the highest sectional score in DILR and the lowest sectional score in QA?',
      '14 marks;16 marks;18 marks;20 marks',
      '18 marks', // DILR max = 96 (Candidate C), QA min = 78 (Candidate C) -> 96 - 78 = 18
      'mock'
    ],

    // 3. Quantitative Aptitude (QA) Questions (including LaTeX formulas)
    [
      '',
      '',
      'QA',
      'MCQ',
      'Solve for $$x$$ in the logarithmic equation: $$\log_2(x) + \log_2(x-2) = 3$$.',
      '$$x = 4$$;$$x = -2$$;$$x = 4$$ or $$x = -2$$;$$x = 8$$',
      '$$x = 4$$',
      'mock'
    ],
    [
      '',
      '',
      'QA',
      'MCQ',
      'If $$f(x) = \sqrt{x^2 + 2x + 1}$$ and $$g(x) = x^2 - 1$$, find the compound value of $$g(f(3))$$.',
      '15;24;8;9',
      '15', // f(3) = sqrt(3^2 + 6 + 1) = sqrt(16) = 4. g(4) = 4^2 - 1 = 15.
      'mock'
    ],
    [
      '',
      '',
      'QA',
      'TITA',
      'Calculate the limit of the fraction as $$x \to \infty$$: $$L = \lim_{x \to \infty} \frac{3x^2 + 5x + 2}{x^2 - 4x + 9}$$.',
      '',
      '3',
      'daily'
    ],
    [
      '',
      '',
      'QA',
      'TITA',
      'If $$y = \sum_{n=1}^{4} n^3$$, what is the numerical value of $$y$$?',
      '',
      '100', // 1^3 + 2^3 + 3^3 + 4^3 = 1 + 8 + 27 + 64 = 100.
      'interval'
    ],
    [
      '',
      '',
      'QA',
      'MCQ',
      'An arithmetic progression (AP) has a first term $$a_1 = 5$$ and a common difference $$d = 3$$. What is the sum of the first 10 terms of this progression?',
      '$$185$$;$$200$$;$$170$$;$$215$$',
      '$$185$$', // S_10 = 10/2 * (2*5 + 9*3) = 5 * (10 + 27) = 5 * 37 = 185.
      'daily'
    ],
    [
      '',
      '',
      'QA',
      'MCQ',
      'What is the value of the exponent expression: $$\frac{3^{n+4} - 9 \cdot 3^n}{3^{n+2}}$$ for any integer $$n$$?',
      '8;9;3;27',
      '8', // (3^n * 81 - 9 * 3^n) / (9 * 3^n) = (81 - 9)/9 = 72/9 = 8.
      'interval'
    ],
    [
      '',
      '',
      'QA',
      'MCQ',
      'A cylinder has a base radius of $$r = 7\text{ cm}$$ and a height of $$h = 10\text{ cm}$$. Calculate its total surface area using $$\pi = \frac{22}{7}$$.',
      '$$748\text{ cm}^2$$;$$616\text{ cm}^2$$;$$440\text{ cm}^2$$;$$880\text{ cm}^2$$',
      '$$748\text{ cm}^2$$', // TSA = 2*pi*r*(r+h) = 2 * 22/7 * 7 * (7+10) = 44 * 17 = 748.
      'interval'
    ],
    [
      '',
      '',
      'QA',
      'MCQ',
      'If $$x + \frac{1}{x} = 5$$, find the value of $$x^2 + \frac{1}{x^2}$$.',
      '23;25;27;21',
      '23', // (x + 1/x)^2 - 2 = 25 - 2 = 23.
      'interval'
    ],
    [
      '',
      '',
      'QA',
      'MCQ',
      'If $$P = \begin{pmatrix} 2 & 1 \\ 0 & 3 \end{pmatrix}$$, find the determinant of $$P$$.',
      '6;5;2;0',
      '6', // 2*3 - 1*0 = 6.
      'daily'
    ],
    [
      '',
      '',
      'QA',
      'MCQ',
      'What is the value of $$\log_{10}(1000) - \log_{2}(16)$$?',
      '-1;1;0;-2',
      '-1', // 3 - 4 = -1.
      'daily'
    ]
  ];

  // Build CSV content
  let csvContent = headers.join(',') + '\n';
  for (const row of rows) {
    const escapedRow = row.map(escapeCSVCell);
    csvContent += escapedRow.join(',') + '\n';
  }

  // Write CSV to disk
  fs.writeFileSync(tempCsvPath, csvContent, 'utf8');
  console.log(`Generated temporary seeding CSV file at: ${tempCsvPath}`);

  try {
    // Connect to DB
    console.log(`Connecting to MongoDB at: ${MONGODB_URI}`);
    await mongoose.connect(MONGODB_URI);

    // Parse CSV
    const parsedQuestions = await parseQuestionsCSV(tempCsvPath);
    console.log(`Successfully parsed ${parsedQuestions.length} questions from CSV.`);

    // Clear existing
    console.log('Clearing existing questions from the database...');
    await Question.deleteMany({});

    // Bulk insert
    const inserted = await Question.insertMany(parsedQuestions);
    console.log(`Successfully seeded ${inserted.length} questions into the database.`);

  } catch (error) {
    console.error('Seeding process failed:', error);
  } finally {
    // Cleanup CSV file
    if (fs.existsSync(tempCsvPath)) {
      fs.unlinkSync(tempCsvPath);
      console.log('Removed temporary seeding CSV file.');
    }
    // Disconnect Mongoose
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

seed();
