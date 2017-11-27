from __future__ import print_function
import numpy as np
import matplotlib.pyplot as plt

import librosa
import librosa.display



def decomposeAudio(filename, PLOT = False):
	print('Called main')
	y, sr = librosa.load(filename, offset=40, duration=10)
	D = librosa.stft(y)
	D_harmonic, D_percussive = librosa.decompose.hpss(D)
	# Pre-compute a global reference power from the input spectrum
	rp = np.max(np.abs(D))

	# time domain signal
	D_harmonic_time = librosa.istft(D_harmonic)
	D_percussive_time = librosa.istft(D_percussive)

	librosa.output.write_wav('penguindrum_harmonic.wav', D_harmonic_time, sr)
	librosa.output.write_wav('penguindrum_percussive.wav', D_percussive_time, sr)

	if PLOT:
		print('Plotting spectogram')
		fig = plt.figure(figsize=(12, 8))

		plt.subplot(3, 1, 1)
		librosa.display.specshow(librosa.amplitude_to_db(D, ref=rp), y_axis='log')
		plt.colorbar()
		plt.title('Full spectrogram')

		plt.subplot(3, 1, 2)
		librosa.display.specshow(librosa.amplitude_to_db(D_harmonic, ref=rp), y_axis='log')
		plt.colorbar()
		plt.title('Harmonic spectrogram')

		plt.subplot(3, 1, 3)
		librosa.display.specshow(librosa.amplitude_to_db(D_percussive, ref=rp), y_axis='log', x_axis='time')
		plt.colorbar()
		plt.title('Percussive spectrogram')
		#plt.tight_layout()
		#plt.show()
		fig.savefig('data/graphs/penguindrumSpectrogram.png')
		plt.show()

	print('Computing decompositions')
	# Let's compute separations for a few different margins and compare the results below
	D_harmonic2, D_percussive2 = librosa.decompose.hpss(D, margin=2)
	D_harmonic4, D_percussive4 = librosa.decompose.hpss(D, margin=4)
	D_harmonic8, D_percussive8 = librosa.decompose.hpss(D, margin=8)
	D_harmonic16, D_percussive16 = librosa.decompose.hpss(D, margin=16)

	harmonics = [D_harmonic, D_harmonic2, D_harmonic4, D_harmonic8, D_harmonic16]
	percussion = [D_percussive, D_percussive2, D_percussive4, D_percussive8, D_percussive16]

	if PLOT:
		fig = plt.figure(figsize=(10, 10))

		for i, harm in enumerate(harmonics):
			plt.subplot(5,2,2*i+1)
			librosa.display.specshow(librosa.amplitude_to_db(harm, ref=rp), y_axis='log')
			plt.title('Harmonic')
			plt.yticks([])
			plt.ylabel('margin=' + str(i+2))

			plt.subplot(5,2,2*i+2)
			librosa.display.specshow(librosa.amplitude_to_db(percussion[i], ref=rp), y_axis='log')
			plt.title('Percussive')
			plt.yticks([])

			print(str(2*i+1) + ',' + str(2*i+2))

		fig.savefig('data/graphs/penguindrumComponentsSpectrogram.png')

		plt.tight_layout()
		plt.show()

if __name__ == '__main__':
	filename = '/Users/lucyzhang/Github/music-drawer-browser/static/uploads/penguindrum.wav'
	decomposeAudio(filename)






