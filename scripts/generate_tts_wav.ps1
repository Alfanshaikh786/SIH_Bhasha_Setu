Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$outWav = $args[0]
$text = $args[1]
$synth.SetOutputToWaveFile($outWav)
$synth.Speak($text)
$synth.Dispose()
Write-Host "Generated WAV: $outWav with text: $text"
