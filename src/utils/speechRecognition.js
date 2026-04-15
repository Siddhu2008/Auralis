export class SpeechTranscription {
    constructor() {
        this.recognition = null;
        this.isRecording = false;
        this.transcript = "";

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = 'en-US';
        }
    }

    start(onResult, onError) {
        if (!this.recognition) {
            if (onError) onError("Speech recognition not supported in this browser.");
            return;
        }

        this.transcript = "";
        this.isRecording = true;

        this.recognition.onresult = (event) => {
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    this.transcript += event.results[i][0].transcript + ' ';
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            if (onResult) onResult(this.transcript.trim(), interimTranscript.trim());
        };

        this.recognition.onerror = (event) => {
            console.error("Speech Recognition Error:", event.error);
            if (onError) onError(event.error);
        };

        this.recognition.onend = () => {
            if (this.isRecording) {
                this.recognition.start(); // Auto-restart if we didn't explicitly stop
            }
        };

        this.recognition.start();
    }

    stop() {
        this.isRecording = false;
        if (this.recognition) {
            this.recognition.stop();
        }
        return this.transcript.trim();
    }
}
