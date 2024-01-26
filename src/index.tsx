import { ActionPanel, Detail, List, Action, LaunchProps } from "@raycast/api";
import { useState, useEffect } from "react";
import fetch from "node-fetch";
import cheerio from "cheerio";

interface SearchArguments {
  query: string;
}

interface Song {
  title: string;
  artist: string;
  songCredits: string;
  copyright: string;
  arrangeUrl: string;
}

export default function Command(props: LaunchProps<{ arguments: SearchArguments }>) {
  const { query } = props.arguments;

  const [songs, setSongs] = useState<Song[]>([]);

  useEffect(() => {
    async function fetchSongs() {
      const url = `https://www.arrangeme.com/search?q=${encodeURIComponent(query)}`;
      const response = await fetch(url);
      const html = await response.text();
      const $ = cheerio.load(html);

      const results: Song[] = [];
      $("tr[data-arrange-url]").each((_, element) => {
        const title = $(element).find("td[data-label='TITLE'] strong").text().trim();
        const artist = $(element).find("td[data-label='ARTIST']").text().trim();
        const songCredits = $(element).find("td[data-label='SONG CREDITS']").text().trim();
        const copyright = $(element).attr("data-copyright")!;
        const arrangeUrl = $(element).attr("data-arrange-url")!;

        results.push({ title, artist, songCredits, copyright, arrangeUrl });
      });

      setSongs(results);
    }

    fetchSongs();
  }, [query]);

  return (
    <List navigationTitle="Search Results" isLoading={songs.length < 1} isShowingDetail={true}>
      {songs.map((song, index) => (
        <List.Item
          key={index}
          title={song.title}
          subtitle={song.artist}
          detail={
            <List.Item.Detail
              // markdown={} // need image of album art here, album title and release year
              metadata={
                <List.Item.Detail.Metadata>
                  <List.Item.Detail.Metadata.Label title="Song Name" text={song.title} />
                  <List.Item.Detail.Metadata.Label title="Artist/Performers" text={song.artist} />
                  <List.Item.Detail.Metadata.Separator />
                  <List.Item.Detail.Metadata.Label title="Credits" text={song.songCredits} />
                  <List.Item.Detail.Metadata.Label title="Copyright Notice" text={song.copyright} />
                  <List.Item.Detail.Metadata.Separator />
                  <List.Item.Detail.Metadata.Link title="ArrangeMe Link" target={`https://www.arrangeme.com${song.arrangeUrl}`} text={`https://www.arrangeme.com${song.arrangeUrl}`} />
                </List.Item.Detail.Metadata>
              }
            />
          }
          actions={
            <ActionPanel>
              <Action.CopyToClipboard content={song.copyright} title="Copy Copyright Notice" />
              <Action.CopyToClipboard content={song.songCredits} title="Copy Credits" />
              <Action.OpenInBrowser url={`https://www.arrangeme.com${song.arrangeUrl}`} title="Open in ArrangeMe" />
              <Action.CopyToClipboard content={song.artist} title="Copy Artist" />
              <Action.CopyToClipboard content={song.title} title="Copy Song Name" />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
