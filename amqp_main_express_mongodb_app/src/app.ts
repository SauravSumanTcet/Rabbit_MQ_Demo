import * as express from 'express';
import { Request, Response } from 'express';
import * as cors from 'cors';
import { createConnection } from 'typeorm';

import { Product } from './entity/product';
import * as amqp from 'amqplib/callback_api';

createConnection().then((db) => {
  amqp.connect(process.env.amqp_url, (error0, connection) => {
    if (error0) {
      throw error0;
    }
    connection.createChannel((error1, channel) => {
      if (error1) {
        throw error1;
      }

      channel.assertQueue('hello', { durable: false });

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

      channel.consume('hello', (msg) => {
        console.log(msg.content.toString());
      });

      app.listen(8001, () => {
        console.log('App is listening to port 8001');
      });

      process.on('beforeExit', () => {
        console.log('closing');
        connection.close();
      });
    });
  });
});
