// script.js
class CustomTokenizer {
    constructor() {
        this.merges = {};
        this.mergeRank = {};
        this.vocab = {};
        this.specialTokens = {};
        this.decoder = new TextDecoder();
    }
    train(text, vocabSize = 512, specialTokens = []) {
        for (let b = 0; b < 256; b++) {
            this.vocab[b] = Uint8Array.from([b]);
        }
        let nextTokenId = 256;
        for (let tok of specialTokens) {
            this.specialTokens[tok] = nextTokenId;
            this.vocab[nextTokenId] = tok;
            nextTokenId++;
        }
        const chunks = text.split(/\s+/).filter(chunk => chunk.length > 0);
        let corpus = chunks.map(chunk => Array.from(new TextEncoder().encode(chunk)));
        let rank = 0;
        while (Object.keys(this.vocab).length < vocabSize) {
            const pairFreq = new Map();
            for (let word of corpus) {
                for (let i = 0; i < word.length - 1; i++) {
                    const pairKey = `${word[i]} ${word[i + 1]}`;
                    pairFreq.set(pairKey, (pairFreq.get(pairKey) || 0) + 1);
                }
            }
            if (pairFreq.size === 0) break;
            let maxFreq = -1;
            let bestPairKey = null;
            for (let [pair, freq] of pairFreq) {
                if (freq > maxFreq) {
                    maxFreq = freq;
                    bestPairKey = pair;
                }
            }
            if (maxFreq < 2) break;
            const [p1, p2] = bestPairKey.split(' ').map(Number);
            const newToken = nextTokenId;
            this.merges[bestPairKey] = newToken;
            this.mergeRank[bestPairKey] = rank;
            rank++;
            this.vocab[newToken] = Uint8Array.from([...this.vocab[p1], ...this.vocab[p2]]);
            nextTokenId++;
            for (let j = 0; j < corpus.length; j++) {
                const word = corpus[j];
                let i = 0;
                const newWord = [];
                while (i < word.length) {
                    if (i < word.length - 1 && word[i] === p1 && word[i + 1] === p2) {
                        newWord.push(newToken);
                        i += 2;
                    } else {
                        newWord.push(word[i]);
                        i++;
                    }
                }
                corpus[j] = newWord;
            }
        }
    }
    encode(text) {
        const chunks = text.split(/\s+/).filter(chunk => chunk.length > 0);
        const tokens = [];
        for (let chunk of chunks) {
            if (this.specialTokens[chunk] !== undefined) {
                tokens.push(this.specialTokens[chunk]);
                continue;
            }
            let wordTokens = Array.from(new TextEncoder().encode(chunk));
            while (true) {
                let minRank = Infinity;
                let mergeIndex = -1;
                let selectedPairKey = null;
                for (let i = 0; i < wordTokens.length - 1; i++) {
                    const pairKey = `${wordTokens[i]} ${wordTokens[i + 1]}`;
                    const r = this.mergeRank[pairKey];
                    if (r !== undefined && r < minRank) {
                        minRank = r;
                        selectedPairKey = pairKey;
                        mergeIndex = i;
                    }
                }
                if (minRank === Infinity) break;
                const newToken = this.merges[selectedPairKey];
                wordTokens = [...wordTokens.slice(0, mergeIndex), newToken, ...wordTokens.slice(mergeIndex + 2)];
            }
            tokens.push(...wordTokens);
        }
        return tokens;
    }
    decode(tokenIds) {
        const parts = [];
        for (let id of tokenIds) {
            const content = this.vocab[id];
            if (typeof content === 'string') {
                parts.push(content);
            } else {
                parts.push(this.decoder.decode(content));
            }
        }
        return parts.join(' ');
    }
}

let tokenizer = null;

function trainTokenizer() {
    const trainingText = document.getElementById('training-text').value;
    const vocabSize = parseInt(document.getElementById('vocab-size').value);
    const specialTokensStr = document.getElementById('special-tokens').value;
    const specialTokens = specialTokensStr ? specialTokensStr.split(',').map(s => s.trim()) : [];
    
    tokenizer = new CustomTokenizer();
    tokenizer.train(trainingText, vocabSize, specialTokens);
    
    document.getElementById('output').innerText = 'Tokenizer trained successfully! Vocabulary size: ' + Object.keys(tokenizer.vocab).length;
}

function encodeText() {
    if (!tokenizer) {
        alert('Please train the tokenizer first!');
        return;
    }
    const inputText = document.getElementById('input-text').value;
    const encoded = tokenizer.encode(inputText);
    document.getElementById('output').innerText = 'Encoded tokens: ' + JSON.stringify(encoded);
}

function decodeText() {
    if (!tokenizer) {
        alert('Please train the tokenizer first!');
        return;
    }
    const inputText = document.getElementById('input-text').value;
    let tokenIds;
    try {
        tokenIds = JSON.parse(inputText);
        if (!Array.isArray(tokenIds)) throw new Error();
    } catch (e) {
        alert('For decoding, input should be a JSON array of token IDs, e.g., [84, 104, 105, 115]');
        return;
    }
    const decoded = tokenizer.decode(tokenIds);
    document.getElementById('output').innerText = 'Decoded text: ' + decoded;
}