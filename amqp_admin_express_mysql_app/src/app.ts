import * as express from 'express';
import { Request, Response } from 'express';
import * as cors from 'cors';
import { createConnection } from 'typeorm';
import * as dotenv from 'dotenv';
import { Product } from './entity/product';
import * as amqp from 'amqplib/callback_api';

dotenv.config();

createConnection().then((db) => {
  const productRepository = db.getRepository(Product);

  amqp.connect(process.env.amqp_url, (error0, connection) => {
    if (error0) {
      throw error0;
    }
    connection.createChannel((error1, channel) => {
      if (error1) {
        throw error1;
      }

      const app = express();
      app.use(
        cors({
          origin: [
            'http://localhost:3000',
            'http://localhost:8080',
            'http://localhost:4200',
          ],
        })
      );

      app.use(express.json());

      app.get('/api/products', async (req: Request, res: Response) => {
        const products = await productRepository.find();
        channel.sendToQueue('hello', Buffer.from('hello'));
        res.json(products);
      });

      app.post('/api/products', async (req: Request, res: Response) => {
        const product = await productRepository.create(req.body);
        const result = await productRepository.save(product);
        res.json(result);
      });

      app.get('/api/products/:id', async (req: Request, res: Response) => {
        const product = await productRepository.findOne(req.params.id);
        res.json(product);
      });

      app.put('/api/products/:id', async (req: Request, res: Response) => {
        const product = await productRepository.findOne(req.params.id);
        productRepository.merge(product, req.body);
        const result = await productRepository.save(product);
        res.json(result);
      });

      app.delete('/api/products/:id', async (req: Request, res: Response) => {
        const product = await productRepository.delete(req.params.id);
        res.json(product);
      });

      app.post(
        '/api/products/:id/like',
        async (req: Request, res: Response) => {
          const product = await productRepository.findOne(req.params.id);
          product.likes++;
          const result = await productRepository.save(product);
          res.send(result);
        }
      );

      app.listen(8000, () => {
        console.log('App is listening to port 8000');
      });

      process.on('beforeExit', () => {
        console.log('closing');
        connection.close();
      });
    });
  });
});
