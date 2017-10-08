from sklearn.naive_bayes import GaussianNB
from sklearn.model_selection import train_test_split
from sklearn import svm
from sklearn.metrics import accuracy_score
from sklearn.neighbors import NearestNeighbors
from sklearn.externals import joblib

import numpy as np

class AudioML(object):
	classifier = None

	'''
	Possible types: naiveBayes, logisticRegression, decisionTree, SVM
	'''
	def __init__(self, MLtype="naiveBayes"):
		self.type = MLtype
		
	def trainGaussianNB(self, features, labels):
		# test set is 33% of the original data set
		train, test, train_labels, test_labels = train_test_split(features,
                                                          labels,
                                                          test_size=0.33,
                                                          random_state=42)
		self.classifier = GaussianNB()
		model = self.classifier.fit(train, train_labels)
		predictions = self.classifier.predict(test)
		print("------------PREDICTIONS---------------")
		print(predictions)
		print("------------ACCURACY SCORE---------------")
		print(accuracy_score(test_labels, predictions))

	def saveModel(self, path='models/audio_model.pkl'):
		joblib.dump(self.classifier, path)




