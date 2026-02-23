import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildServer, resolveWebDist } from './app.js';
import { TvMazeGateway } from './integrations/tvmaze.js';
import { PrismaWatchedRepository } from './repositories/watchedRepository.js';
import { PrismaCommentRepository } from './repositories/commentRepository.js';
import { PrismaRatingRepository } from './repositories/ratingRepository.js';
import { PrismaLibraryRepository } from './repositories/libraryRepository.js';
import { DashboardService } from './services/dashboardService.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const webDist = resolveWebDist(currentDir);
const showsGateway = new TvMazeGateway();

const server = buildServer({
  showsGateway,
  watchedRepository: new PrismaWatchedRepository(),
  commentRepository: new PrismaCommentRepository(),
  ratingRepository: new PrismaRatingRepository(),
  libraryRepository: new PrismaLibraryRepository(),
  dashboardService: new DashboardService(showsGateway),
  webDist
});

const port = Number(process.env.PORT ?? 7777);

server.listen({ port, host: '0.0.0.0' }).catch((error) => {
  server.log.error(error, 'failed to start server');
  process.exit(1);
});
