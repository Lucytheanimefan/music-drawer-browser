filename = 'static/uploads/signal.wav'
Fsampling=44100;%frequency sampling = 44100Hz 
duration=10;%tone duration = 1s

Ftone1=440;%sound1 frequency = 440Hz 
Ftone2=1320;%sound1 frequency = 500Hz

left=sin([1:Fsampling*duration]*2*pi*Ftone1/Fsampling);%generate sound1 for 1s 
right=sin([1:Fsampling*duration]*2*pi*Ftone2/Fsampling);%generate sound1 for 1s
stereosnd = [left; right];
stereosnd = stereosnd';
f = abs(fft(stereosnd));
subplot(2,1,1);
plot(stereosnd);
subplot(2,1,2);
plot(f);
soundsc(stereosnd, Fsampling);
audiowrite(filename, stereosnd, Fsampling)