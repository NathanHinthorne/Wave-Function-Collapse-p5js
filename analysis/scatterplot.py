import pandas as pd
import matplotlib.pyplot as plt
df = pd.read_csv("data.csv")
df.plot(kind='scatter',x='Grid size',y='Backtracks') # scatter plot

plt.title('Grid size vs Backtracks')

plt.xticks(df['Grid size'].unique()) 

plt.show()