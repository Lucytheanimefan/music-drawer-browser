filename = 'static/uploads/input.wav'

% Returns sampled data, y, and a sample rate for that data, Fs.
[y,Fs] = audioread(filename)

% Returns the cumulative maximum elements of A
M = cummax(y)

[yupper,ylower] = envelope(y)