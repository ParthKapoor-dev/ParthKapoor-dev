declare module 'png-js' {
    export default class PNG {
        constructor(buffer: any);
        decode(callback: (pixels: any) => void): void;
    }
}

declare module 'gifencoder' {
    import { ReadStream } from 'fs';

    export default class GIFEncoder {
        constructor(width: number, height: number);
        createReadStream(): ReadStream;
        start(): void;
        setRepeat(iter: number): void;
        setDelay(ms: number): void;
        setQuality(quality: number): void;
        addFrame(ctx: any): void;
        finish(): void;
    }
}
