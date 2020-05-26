all: data
	pip install audiosegment


data: GenData/YT-WAV-gen.py
	wget --header="Host: doc-ac-44-drive-data-export.googleusercontent.com" --header="User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/80.0.3987.163 Chrome/80.0.3987.163 Safari/537.36" --header="Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9" --header="Accept-Language: en-US,en;q=0.9" --header="Referer: https://drive.google.com/drive/u/0/folders/1J4kjUbFFXkgeZVJVJ8PiqBimHZx5iDmQ" --header="Cookie: AUTH_a636saqtv69lgooiad0bloj5on5d18ot_nonce=squh7ds58mkqa" --header="Connection: keep-alive" "https://doc-ac-44-drive-data-export.googleusercontent.com/download/ht6uegekr47ce75si6sghvidm7eeit7k/qg0blv9jmc4jfi6oduncaj63sqj2n9hn/1589058000000/084d26ca-951a-4824-b7dc-a1d6b4897a74/106145016194666033096/ADt3v-MgHX7mUtOPmyz4bNwg71f_ox3WBHZkl6zJ_BZ9t_crnnYLEqWMkCzAq7fgoGnc_HRjgG8wi4iTBEZvdLHGSJEkvFVO9i6ZWybomWO6BrBfT0OsmRpYkzgWvE9r9sGOJ5ek3wLRCxD5Z3VN4Q7mMxRXrkn1wIWRUeo6O3YgEJsG13GSK9cx-PRGoTxdVskqOHlXNJzV3jKERBKYauPb9J5beVAc_CN9ouSHwhIvy4tie2uDfy58GnXdr9e9ABKa11e8GqYzDhwPuGaan0sIy3lneZZCWJDKqAt-H_oy94fyQ3PbmY0-D5Yvd36HlqzwH9mQpdgz?authuser=0&nonce=squh7ds58mkqa&user=106145016194666033096&hash=kbp1ggubdqg1jqmjo212hagrg14e95q6" -c -O 'Data.zip'
	sudo apt-get install unzip
	unzip Data.zip
	rm Data.zip
	pip install audiosegment

clean: 
	rm -rf Data Data.zip
