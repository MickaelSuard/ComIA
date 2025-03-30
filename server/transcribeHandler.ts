// import express from 'express';
// import multer from 'multer';
// import { exec } from 'child_process';
// import fs from 'fs/promises';

// const router = express.Router();
// const upload = multer({ dest: 'uploads/' });

// router.post('/api/transcribe', upload.single('file'), async (req, res) => {
//   const filePath = req.file?.path;
//   if (!filePath) {
//     return res.status(400).send('Aucun fichier fourni.');
//   }

//   try {
//     // Call Whisper for transcription
//     const transcription = await new Promise<string>((resolve, reject) => {
//       exec(`whisper ${filePath} --model base --language fr`, (error, stdout) => {
//         if (error) return reject(error);
//         resolve(stdout.trim());
//       });
//     });

//     // Generate a summary (mocked for simplicity)
//     const summary = `Résumé généré pour: ${transcription.substring(0, 100)}...`;

//     // Clean up uploaded file
//     await fs.unlink(filePath);

//     res.json({ transcription, summary });
//   } catch (error) {
//     console.error('Erreur lors de la transcription:', error);
//     res.status(500).send('Erreur lors de la transcription.');
//   }
// });

// export default router;
