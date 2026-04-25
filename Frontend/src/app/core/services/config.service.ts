import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ConfigService {
    private config: { apiUrl: string } = { apiUrl: '' };

    load(): Promise<void> {
        return fetch('/assets/config.json')
            .then(res => res.json())
            .then(data => { this.config = data; });
    }

    get apiUrl(): string {
        return this.config.apiUrl;
    }
}