# Loaded variable 'df' from URI: c:\Dev\ygo-cards-data-visualization\data\cards.csv
import pandas as pd
df = pd.read_csv(r"c:\Dev\ygo-cards-data-visualization\data\cards.csv")
# Drop column: 'ban_tcg'
df = df.drop(columns=['ban_tcg'])
# Drop column: 'ban_goat'
df = df.drop(columns=['ban_goat'])
# Drop column: 'formats'
df = df.drop(columns=['formats'])
# Drop column: 'treated_as'
df = df.drop(columns=['treated_as'])
# Drop column: 'tcg_date'
df = df.drop(columns=['tcg_date'])
# Drop column: 'konami_id'
df = df.drop(columns=['konami_id'])
# Drop column: 'viewsweek'
df = df.drop(columns=['viewsweek'])
df.to_csv(
    r"c:\Dev\ygo-cards-data-visualization\data\cards_cleaned.csv",
    index=False
)
