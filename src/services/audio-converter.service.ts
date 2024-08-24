import ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { Logger } from './logger.service.js';
import { singleton } from 'tsyringe';

@singleton()
export class AudioConverter {
    constructor(private readonly logger: Logger) {}
    
    async toMp3(audioBuffer: ArrayBuffer): Promise<string> {
        const tempDir = await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()), path.sep));

        try {
            const originalAudioPath = path.join(tempDir, "originalAudio");
            const mp3AudioPath = path.join(tempDir, `conversation.mp3`);
            await fs.writeFile(originalAudioPath, Buffer.from(audioBuffer));
            await this.transcodeAudio(originalAudioPath, mp3AudioPath, "mp3");
            this.logger.debug("Audio converted to mp3", { mp3AudioPath });
            return mp3AudioPath;
        }
        catch (error) {
            this.logger.error("Error converting audio to mp3", { error });
            await fs.rm(tempDir, { recursive: true });
            return "";
        }
    }

    async transcodeAudio(inputPath: string, outputPath: string, outputFormat: string): Promise<void> {
        return new Promise((resolve, reject) => {
            ffmpeg()
                .input(inputPath)
                .outputFormat(outputFormat)
                .on("error", (error) => {
                    reject(error);
                })
                .on("end", () => {
                    resolve();
                })
                .save(outputPath);
        });
    }
}