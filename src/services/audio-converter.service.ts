import ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { logger } from './logger.service.js';

class AudioConverter {
    async toMp3(audioBuffer: Buffer): Promise<string> {
        const tempDir = await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()), path.sep));

        try {
            const originalAudioPath = path.join(tempDir, "originalAudio");
            const mp3AudioPath = path.join(tempDir, `conversation.mp3`);
            await fs.writeFile(originalAudioPath, audioBuffer);
            await this.transcodeAudio(originalAudioPath, mp3AudioPath, "mp3");
            logger.debug("Audio converted to mp3", { mp3AudioPath });
            return mp3AudioPath;
        }
        catch (error) {
            logger.error("Error converting audio to mp3", { error });
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

export const audioConverter = new AudioConverter();