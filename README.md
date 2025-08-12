# custom_tokenizer2
Build a custom tokenizer in JavaScript that learns vocab from text, supports ENCODE/DECODE and handles special tokens

1. CustomTokenizer Class
The CustomTokenizer class provides methods for training a tokenizer, encoding text, and decoding token IDs.

2. train Method:
This method trains the tokenizer on a given corpus of text and builds a vocabulary based on Byte Pair Encoding (BPE).

3. encode Method:
This method encodes a given input text into token IDs.

4. decode Method:
This method converts a list of token IDs back into text.

5. User Interface Functions
trainTokenizer: This function is triggered by a UI button. It reads the training text, vocabulary size, and special tokens from the input fields and then trains the tokenizer.
It creates an instance of CustomTokenizer and calls the train method.
Once the training is complete, it displays a message showing the vocabulary size.
encodeText: This function encodes a given input text into token IDs. It calls the encode method and displays the result.
decodeText: This function decodes a list of token IDs into the original text. It expects the input to be a JSON array (e.g., [84, 104, 105]) and calls the decode method to reconstruct the text.




