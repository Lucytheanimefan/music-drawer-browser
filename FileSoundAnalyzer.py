import mutagen
import wave
import numpy as np
import struct
import subprocess
import os
#import soundfile as sf
#import matplotlib.pyplot as plt
import speech_recognition as sr
#from pocketsphinx import AudioFile, get_model_path, get_data_path
from multiprocessing import Process
import contextlib

APP_ROOT = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = '/tmp/'#os.path.join(APP_ROOT, 'static/uploads/')

SECOND = 44100
MINUTE = 60 * SECOND
THREE_MINUTE = 2 * MINUTE
sz = SECOND
r = sr.Recognizer()

class SoundAnalyzer(object):

	def __init__(self, filename):
		self.filename = filename
		self.seconds = None

	def create_input_wav_file(self):
		#print os.path.dirname(os.path.abspath(__file__))
		command_string = 'mpg123 -k 7000 -n 2400 -w input.wav {}'.format(UPLOAD_FOLDER + self.filename)
		commands = command_string.split()
		p = subprocess.Popen(commands, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
		p.wait()

	def duration(self):
		with contextlib.closing(wave.open(UPLOAD_FOLDER + self.filename,'r')) as f:
		    frames = f.getnframes()
		    rate = f.getframerate()
		    duration = frames / float(rate)
		    print(duration)
		    self.seconds = duration
		    return int(duration)
		# f = sf.SoundFile(UPLOAD_FOLDER + self.filename)
		# print('samples = {}'.format(len(f)))
		# print('sample rate = {}'.format(f.samplerate))
		# self.seconds = (len(f) / f.samplerate)
		# return self.seconds

	def process_file(self, should_filter=False, preprocess = False, aslist = False):
		wr = None
		seconds = None
		if preprocess:
			#print 'Preprocessing'
			self.create_input_wav_file()
			wr = wave.open('input.wav', 'r')
		else:
			wr = wave.open(UPLOAD_FOLDER + self.filename, 'r')
			seconds = self.duration()
		sz = seconds#SECOND# * seconds# Read and process 1 second at a time, 44.1 kHz
		data = wr.readframes(sz)
		#print struct.unpack("<H", data)
		da = np.fromstring(data, dtype=np.int16)
		wr.close()
		left, right = da[0::2], da[1::2]

		# returns 1/2+1 as many numbers as it was given
		lf, rf = np.fft.rfft(left), np.fft.rfft(right)

		if should_filter:
			#print 'Filter'
			lowpass = 21 # Remove lower frequencies below human hearing range
			highpass = 9000 # Remove higher frequencies above human voice range

			lf[:lowpass], rf[:lowpass] = 0, 0 # low pass filter 
			lf[55:66], rf[55:66] = 0, 0 # line noise filter
			lf[highpass:], rf[highpass:] = 0,0 # high pass filter 
			nl, nr = np.fft.irfft(lf), np.fft.irfft(rf) # we recreate the original signal via an inverse FFT

			# combines the left and right channels again using the column_stack() function, interleaves the left and right samples using the ravel() method and finally converts them to 16-bit integers with the astype() method
			ns = np.column_stack((nl,nr)).ravel().astype(np.int16)

		if aslist:
			return {'sound': { 'left':left.tolist(), 'right':right.tolist() }, 'frequency': {'left':lf.tolist(), 'right': rf.tolist()}}

		print "Done processing audio file"

		print len(left)

		# For now, not returning frequency - need to figure out how to deal with frequency
		#return {'sound': { 'left':left, 'right':right }, 'frequency': {'left':lf, 'right': rf}}
		return {'sound': { 'left':left.tolist(), 'right':right.tolist() }} #, 'frequency': {'left':lf, 'right': rf}}

	def transcribe_file(self):
		# use the audio file as the audio source
		with sr.AudioFile(UPLOAD_FOLDER + self.filename) as source:
			audio = r.record(source)  # read the entire audio file

		#process_goog = Process(target=self.run_google_speech_rec, args=(audio,))
		#process_goog.start()

		# recognize speech using Google Speech Recognition
		#self.run_google_speech_rec(audio)
		'''
		model_path = get_model_path()
		data_path = get_data_path()

		config = {
		    'verbose': False,
		    'audio_file': os.path.join(UPLOAD_FOLDER, 'castle.raw'),
		    'buffer_size': 2048,
		    'no_search': False,
		    'full_utt': False,
		    'hmm': os.path.join(model_path, 'en-us'),
		    'lm': os.path.join(model_path, 'en-us.lm.bin'),
		    'dict': os.path.join(model_path, 'cmudict-en-us.dict')
		    }
		audio = AudioFile(**config)
		for phrase in audio:
		    print(phrase)
		'''


	def run_google_speech_rec(self, audio):
		try:
			# write text fo file
			file = open('googlespeech.txt', 'w+')
			text = "Google Speech Recognition thinks you said: \n" + str(r.recognize_google(audio))
			#print text
			file.write(text)
		except sr.UnknownValueError:
		    print("Google Speech Recognition could not understand audio")
		except sr.RequestError as e:
		    print("Could not request results from Google Speech Recognition service; {0}".format(e))

	def run_sphinx_speech_rec(self, audio):
		# recognize speech using Sphinx
		try:
		    return ("Sphinx thinks you said: \n" + r.recognize_sphinx(audio))
		except sr.UnknownValueError:
		    print("Sphinx could not understand audio")
		except sr.RequestError as e:
		    print("Sphinx error; {0}".format(e))

	def run_wit_ai_speech_rec(self, wit_ai_key, audio):
		# recognize speech using Wit.ai
		try:
			return ("Wit.ai thinks you said: \n" + r.recognize_wit(audio, key=wit_ai_key))
		except sr.UnknownValueError:
		    print("Wit.ai could not understand audio")
		except sr.RequestError as e:
		    print("Could not request results from Wit.ai service; {0}".format(e))

	def run_bing_speech_rec(self, bing_key, audio):
		# recognize speech using Microsoft Bing Voice Recognition
		try:
		    return ("Microsoft Bing Voice Recognition thinks you said: \n" + r.recognize_bing(audio, key=bing_key))
		except sr.UnknownValueError:
		    print("Microsoft Bing Voice Recognition could not understand audio")
		except sr.RequestError as e:
		    print("Could not request results from Microsoft Bing Voice Recognition service; {0}".format(e))


'''
# for debugging, plot a figure of the sound and the frequencies 
def graph_fft(sound_data, frequency_data, seconds):
	plt.figure(1)
	a = plt.subplot(211)
	r = 2**16/2
	a.set_ylim([-r, r])
	a.set_xlabel('time [s]')
	a.set_ylabel('sample value [-]')
	x = np.arange(seconds)/(seconds)
	plt.plot(x, sound_data)
	b = plt.subplot(212)
	b.set_xscale('log')
	b.set_xlabel('frequency [Hz]')
	b.set_ylabel('|amplitude|')
	plt.plot(abs(frequency_data))
	plt.savefig('sample-graph.png')
'''




if __name__ == '__main__':
	sound = SoundAnalyzer("input.wav")
	#sound.transcribe_file()
	data = sound.process_file()
	print data
	#sound.duration()
	#graph_fft(data['sound']['left'], data['frequency']['left'], sound.seconds * SECOND)




