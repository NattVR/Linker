import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WinstonModule } from 'nest-winston';
import { winstonTransports } from './logger/winston.config';

const PORT = 3000;

const winstonLogger = WinstonModule.createLogger({
  transports: winstonTransports,
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: winstonLogger,
  });

  app.enableCors({
    origin: 'http://localhost:4200',
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    credentials: true,
  });

  await app.listen(process.env.PORT ?? PORT);
}

void bootstrap(); // NOSONAR typescript:S4123