import type { SavedShow } from '../models.js';
import type { LibraryRepository } from '../ports.js';

export class SetShowSavedUseCase {
  constructor(private readonly libraryRepository: LibraryRepository) {}

  async execute(params: { showId: number; saved: boolean }): Promise<void> {
    await this.libraryRepository.setShowSaved(params.showId, params.saved);
  }
}

export class ListSavedShowsUseCase {
  constructor(private readonly libraryRepository: LibraryRepository) {}

  async execute(): Promise<SavedShow[]> {
    return this.libraryRepository.listSavedShows();
  }
}
