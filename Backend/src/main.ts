import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WinstonModule } from 'nest-winston';
import { winstonTransports } from './logger/winston.config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const PORT = 3000;

const winstonLogger = WinstonModule.createLogger({
  transports: winstonTransports,
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: winstonLogger,
  });

  const config = new DocumentBuilder()
  .setTitle('Linker')
  .setDescription('API documentation')
  .addBearerAuth()
  .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('docs', app, document);



  app.enableCors({
    origin: [
      'http://localhost:4200',
      'http://localhost:4201',
      'http://host.docker.internal:4200',
      'http://host.docker.internal:4201',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  await app.listen(process.env.PORT ?? PORT);
}

void bootstrap(); // NOSONAR typescript:S4123