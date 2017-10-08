import audioBasicIO
import audioFeatureExtraction
import matplotlib.pyplot as plt
import audioTrainTest as aT


plot = False
[Fs, x] = audioBasicIO.readAudioFile("data/Heavy.wav");
F = audioFeatureExtraction.stFeatureExtraction(x, Fs, 0.050*Fs, 0.025*Fs);
# ZCR: The rate of sign-changes of the signal during the duration of a particular frame.
if plot:
	plt.subplot(2,2,1); plt.plot(F[0,:]); plt.xlabel('Frame no'); plt.ylabel('ZCR'); 
	plt.subplot(2,2,2); plt.plot(F[1,:]); plt.xlabel('Frame no'); plt.ylabel('Energy'); 
	plt.subplot(2,2,3); plt.plot(F[2,:]); plt.xlabel('Frame no'); plt.ylabel('Entropy of Energy');
	plt.subplot(2,2,4); plt.plot(F[3,:]); plt.xlabel('Frame no'); plt.ylabel('Spectral Centroid');
	plt.show()

Result, P, classNames = aT.fileClassification("data/Heavy.wav", "data/svmMusicGenre3","svm")
print Result
print P
print classNames