import { Component, OnInit, NgZone } from "@angular/core";
import { orderBy } from "lodash";
declare const gapi: any;

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.less"]
})
export class AppComponent implements OnInit {
  sortName: string | null = null;
  sortValue: string | null = null;
  initialized = false;
  user: any;
  isSignedIn = false;
  userName: string;
  channelId = "";
  items = [];
  listOfDisplayData = [];
  isLoading = false;

  constructor(private ngZone: NgZone) {}

  ngOnInit() {
    gapi.load("client", () => {
      gapi.client
        .init({
          // apiKey: 'AIzaSyBqB01j128dFbzveCsLH5Hf2f6Yyqu-DMA',
          clientId:
            "939309988257-nffoo68sk5s9b1dosn8skeodrpsolnl6.apps.googleusercontent.com",
          discoveryDocs: [
            "https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest"
          ],
          scope: "https://www.googleapis.com/auth/youtube"
        })
        .then(() => {
          this.ngZone.run(() => {
            this.initialized = true;
            this.isSignedIn = gapi.auth2.getAuthInstance().isSignedIn.get();
          });
        });
    });
  }

  signIn() {
    gapi.auth2
      .getAuthInstance()
      .signIn({
        ux_mode: "popup"
      })
      .then((user: any) => {
        this.ngZone.run(() => {
          this.user = user;
          this.isSignedIn = true;
          this.userName = user.getBasicProfile().getName();
        });
      });
  }

  async get() {
    this.isLoading = true;
    const listChannelsResponse = await gapi.client.youtube.channels.list({
      part: "contentDetails",
      id: this.channelId
    });
    const playlist =
      listChannelsResponse.result.items[0].contentDetails.relatedPlaylists
        .uploads;
    let listPlaylistItemsResponse, nextPageToken;
    let items = [];

    do {
      listPlaylistItemsResponse = await gapi.client.youtube.playlistItems.list({
        part: "snippet",
        playlistId: playlist,
        maxResults: 50,
        pageToken: nextPageToken
      });
      nextPageToken = listPlaylistItemsResponse.result.nextPageToken;
      const videosIds = [];

      listPlaylistItemsResponse.result.items.forEach(video => {
        videosIds.push(video.snippet.resourceId.videoId);
      });

      if (videosIds.length > 0) {
        const listVideosResponse = await gapi.client.youtube.videos.list({
          part:
            "contentDetails,id,liveStreamingDetails,localizations,player,recordingDetails,snippet,statistics,status,topicDetails",
          id: videosIds.join(",")
        });
        this.ngZone.run(() => {
          items.push(...listVideosResponse.result.items);
        });
      }
    } while (nextPageToken);

    this.items = items;
    this.isLoading = false;
    this.search();
  }

  sort(sort: { key: string; value: string }): void {
    this.sortName = sort.key;
    this.sortValue = sort.value;
    this.search();
  }

  search(): void {
    const data = this.items;
    /** sort data **/
    if (this.sortName && this.sortValue) {
      this.listOfDisplayData = orderBy(
        data,
        [this.sortName],
        [this.sortValue === "ascend" ? "asc" : "desc"]
      );
    } else {
      this.listOfDisplayData = data;
    }
  }
}
