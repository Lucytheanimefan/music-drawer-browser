from sklearn.naive_bayes import GaussianNB
from sklearn.model_selection import train_test_split
from sklearn import svm

class AudioML(object):

	def __init__(self, MLtype="GaussianNB"):
		self.type = MLtype


	def trainGaussianNB(self, features, labels):
		# test set is 33% of the original data set
		train, test, train_labels, test_labels = train_test_split(features,
                                                          labels,
                                                          test_size=0.33,
                                                          random_state=42)
		gnb = GaussianNB()
		model = gnb.fit(train, train_labels)
		predictions = gnb.predict(test)
		print("------------PREDICTIONS---------------")
		print(predictions)



