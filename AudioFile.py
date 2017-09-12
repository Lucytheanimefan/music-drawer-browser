import pyaudio
import wave
import sys
import os

class AudioFile:
    chunk = 1024

    '''
    rate is the number of samples collected per second.
    Chunk is the number of frames in the buffer.
    Each frame will have n samples samples as channels.
    '''
    def __init__(self, file):
        """ Init audio stream """ 
        self.wf = wave.open(file, 'rb')
        self.p = pyaudio.PyAudio()
        self.rate = self.wf.getframerate()
        print(self.rate)
        self.stream = self.p.open(
            format = self.p.get_format_from_width(self.wf.getsampwidth()),
            channels = self.wf.getnchannels(),
            rate = int(self.wf.getframerate()),
            output = True
        )

    def create_file(self, filename):
        if os.path.exists(filename):
            append_write = 'a' # append if already exists
        else:
            append_write = 'w' # make a new file if not
        self.file = open(filename,append_write)

    # contains amplitude (loudness) information at that particular point in time
    def play(self):
        self.create_file("audioData.txt")
        """ Play entire file """
        data = self.wf.readframes(self.chunk)
        while data != '':
            formatted_data = map(ord, list(data))
            #print(map(ord, list(data)))
            self.stream.write(data)
            data = self.wf.readframes(self.chunk)
            self.file.write(str(formatted_data))
            # write the values to a text file for frontend to read
            

    def close(self):
        """ Graceful shutdown """ 
        self.stream.close()
        self.p.terminate()


if __name__ == '__main__':        
    # Usage example for pyaudio
    a = AudioFile("static/uploads/input.wav")
    a.play()
    a.close()