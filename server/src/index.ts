import express from 'express';
import routes from './routes';
import config, { dbConnect } from './config';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/', routes);

dbConnect().then(() => {
  app.listen(config.PORT, () => {
    console.log(`Server is running on port ${config.PORT}`);
  });
});
