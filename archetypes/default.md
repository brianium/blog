+++
date = '{{ .Date }}'
draft = true
title = '{{ replace .File.ContentBaseName "-" " " | title }}'
author = "Brian Scaturro"
description = ""            # SEO meta + OG/social description
tags = []

# Cover (optional). Omit and the post uses the site-default ambient cover, auto-tinted
# from the title. To give this post its own cover, drop cover-poster.jpg + cover.mp4 +
# cover.webm into this folder and uncomment:
# coverPoster = "cover-poster.jpg"   # still cover (LCP); doubles as OG image + card thumb
# coverVideo  = "cover.mp4"          # ~5s muted loop; .webm sibling auto-discovered
+++
