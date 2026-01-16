import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import 'express-async-errors';

import routes from './routes';
import { errorHandler } from './middleware/errorHandler';

const PORT = process.env.PORT || 4000;

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', routes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
