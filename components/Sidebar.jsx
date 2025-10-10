import pandas as pd
import numpy as np
import mne

# === CONFIG ===
FILE_PATH = "usk_raw.txt"          # Your raw OpenBCI file
SAVE_NPY = "usk_cleaned_eeg.npy"
SAVE_FIF = "usk_cleaned_eeg.fif"

EEG_CHANNELS = [f"EXG Channel {i}" for i in range(8)]
SAMPLE_RATE = 250.0
BANDPASS_LOW, BANDPASS_HIGH = 1.0, 80.0
NOTCH_FREQ = 50.0
RESAMPLE_TARGET = 256.0  # set None to keep 250 Hz

# === 1. LOAD RAW FILE ===
df = pd.read_csv(FILE_PATH, comment="%", low_memory=False)
eeg_data = df[EEG_CHANNELS].to_numpy().T  # shape (8, n_samples)

info = mne.create_info(ch_names=[f"Ch{i}" for i in range(8)],
                       sfreq=SAMPLE_RATE,
                       ch_types="eeg")
raw = mne.io.RawArray(eeg_data, info)
print(f"Loaded data: {raw}")

# === 2. FILTERING ===
print("Applying band-pass and notch filters...")
raw.notch_filter(freqs=[NOTCH_FREQ], picks="eeg", method="iir",
                 iir_params={"ftype": "butter", "order": 2})
raw.filter(l_freq=BANDPASS_LOW, h_freq=BANDPASS_HIGH,
           picks="eeg", method="fir", phase="zero")

# === 3. (OPTIONAL) RESAMPLE TO 256 Hz ===
if RESAMPLE_TARGET is not None and RESAMPLE_TARGET != SAMPLE_RATE:
    print(f"Resampling from {SAMPLE_RATE} Hz → {RESAMPLE_TARGET} Hz...")
    raw.resample(RESAMPLE_TARGET, npad="auto")

# === 4. ICA CLEANING ===
print("Running ICA...")
ica = mne.preprocessing.ICA(n_components=0.95, method="fastica",
                            random_state=42, max_iter="auto")
ica.fit(raw)

# Inspect ICA components visually to identify artifacts
# ica.plot_components()  # <-- uncomment for inspection
# Example: exclude component indices after inspection
ica.exclude = []  # e.g., [0, 1] for blink/muscle artifacts

print("Applying ICA exclusion...")
raw_clean = ica.apply(raw.copy())

# === 5. SAVE CLEANED EEG ===
clean_data = raw_clean.get_data()  # shape (8, n_samples)
np.save(SAVE_NPY, clean_data)
raw_clean.save(SAVE_FIF, overwrite=True)

print(f"Saved cleaned EEG to {SAVE_NPY} and {SAVE_FIF}")
print(f"Cleaned shape: {clean_data.shape}")
print(f"Sampling rate: {raw_clean.info['sfreq']} Hz")
