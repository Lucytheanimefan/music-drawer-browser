import mutagen
import wave
import numpy as np
import struct
import subprocess
import os
import soundfile as sf
import matplotlib.pyplot as plt

APP_ROOT = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(APP_ROOT, 'static/uploads/')

SECOND = 44100
MINUTE = 60 * SECOND
THREE_MINUTE = 2 * MINUTE

class SoundAnalyzer(object):

	def __init__(self, filename):
		self.filename = filename
		self.seconds = None

	def create_input_wav_file(self):
		print os.path.dirname(os.path.abspath(__file__))
		command_string = 'mpg123 -k 7000 -n 2400 -w input.wav {}'.format(UPLOAD_FOLDER + self.filename)
		commands = command_string.split()
		p = subprocess.Popen(commands, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
		p.wait()

	def duration(self):
		f = sf.SoundFile(UPLOAD_FOLDER + self.filename)
		print('samples = {}'.format(len(f)))
		print('sample rate = {}'.format(f.samplerate))
		self.seconds = (len(f) / f.samplerate)
		return self.seconds

	def process_file(self, should_filter=False, preprocess = True):
		wr = None
		seconds = None
		if preprocess:
			print 'Preprocessing'
			self.create_input_wav_file()
			wr = wave.open('input.wav', 'r')
		else:
			wr = wave.open(UPLOAD_FOLDER + self.filename, 'r')
			seconds = self.duration()
		sz = SECOND * seconds# Read and process 1 second at a time, 44.1 kHz
		data = wr.readframes(sz)
		#print struct.unpack("<H", data)
		da = np.fromstring(data, dtype=np.int16)
		wr.close()
		left, right = da[0::2], da[1::2]

		# returns 1/2+1 as many numbers as it was given
		lf, rf = np.fft.rfft(left), np.fft.rfft(right)

		if should_filter:
			print 'Filter'
			lowpass = 21 # Remove lower frequencies below human hearing range
			highpass = 9000 # Remove higher frequencies above human voice range

			lf[:lowpass], rf[:lowpass] = 0, 0 # low pass filter 
			lf[55:66], rf[55:66] = 0, 0 # line noise filter
			lf[highpass:], rf[highpass:] = 0,0 # high pass filter 
			nl, nr = np.fft.irfft(lf), np.fft.irfft(rf) # we recreate the original signal via an inverse FFT

			# combines the left and right channels again using the column_stack() function, interleaves the left and right samples using the ravel() method and finally converts them to 16-bit integers with the astype() method
			ns = np.column_stack((nl,nr)).ravel().astype(np.int16)

		return {'sound': { 'left':left, 'right':right }, 'frequency': {'left':lf, 'right': rf}}


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




if __name__ == '__main__':
	sound = SoundAnalyzer("Heavy.wav")
	data = sound.process_file(preprocess = False)
	sound.duration()
	graph_fft(data['sound']['left'], data['frequency']['left'], sound.seconds * SECOND)




