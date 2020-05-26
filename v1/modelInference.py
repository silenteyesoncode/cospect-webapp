import sys
import time
import os

from flask import Flask, jsonify
app = Flask(__name__)

import tensorflow as tf
from scipy.io import wavfile
import audiofile
import numpy as np

path_arr = os.path.abspath(".").split(os.path.sep)
base_path = os.path.sep.join(path_arr) + "/"

model_path = base_path + "tf-model"

def load_model():
	imported = tf.keras.models.load_model(model_path)

	return imported

model = load_model()

class InvalidUsage(Exception):
    status_code = 400

    def __init__(self, message, status_code=None, payload=None):
        Exception.__init__(self)
        self.message = message
        if status_code is not None:
            self.status_code = status_code
        self.payload = payload

    def to_dict(self):
        rv = dict(self.payload or ())
        rv['message'] = self.message
        return rv

@app.errorhandler(InvalidUsage)
def handle_invalid_usage(error):
    response = jsonify(error.to_dict())
    response.status_code = error.status_code
    return response

@app.route("/analyze/<id>")
def runInference(id):
	startTime = time.time()

	fileName = base_path + "uploads/" + id

	#TODO: Put this in a try/catch, if the file cannot be read
	sampling_rate, audio = wavfile.read(fileName)
	#audio, sampling_rate = audiofile.read(fileName)

	if len(audio.shape) == 2:
		audio = np.reshape(np.mean(audio, axis=1), (-1))
	#TODO: if len of audio.shape is more than 3, something is wrong. Throw an error
	if len(audio.shape) != 1:
		if audio.shape[1] != 1:
			raise InvalidUsage("Audio has improper number of channels")

	seq_length = 50000
	audio = np.pad(audio, ((0, seq_length-(len(audio)%seq_length))))
	audio = np.split(audio, len(audio)/seq_length)
	audio = np.asarray(audio)

	result = model.predict(tf.constant(audio, dtype="float32")).flatten()
	result = np.ceil(np.mean(result)-.7) #1 if mean of results is greater than 0.7

	symptom = "High" if result==1 else "Low"

	output = {"symptom":symptom}
	return jsonify(output)

if __name__ == "__main__":
	app.run(debug=True)
	#app.run()
