
#include VA.ahk
#SingleInstance, Force
CoordMode, Mouse, Screen

audioMeter := VA_GetAudioMeter()

VA_IAudioMeterInformation_GetMeteringChannelCount(audioMeter, channelCount)

VA_IAudioMeterInformation_GetPeakValue(audioMeter, peakValue)

FileAppend, %peakValue%, *

ExitApp, 0