require('dotenv').config()
const {google} = require('googleapis');
const youtube = google.youtube('v3');

// Function to get playlist Details
module.exports.getPlaylistDetails = async (playlistId)=>{
    let details = await youtube.playlists.list({
        key : process.env.Google_API_Key, // Your Google API Key
        part : 'contentDetails, snippet',
        id : playlistId
    });
    if(details.data.pageInfo.totalResults < 1){
        // No videos or wrong playlist Id
        return { error : true, msg : 'The Playlist Id is Wrong. Or There Might be No Videos in This Playlist.'};
    }else{
        return {
            playlistTitle : details.data.items[0].snippet.title,
            playlistDescription : details.data.items[0].snippet.description,
            playlistThumbnail : details.data.items[0].snippet.thumbnails.medium.url,
            totalVideos : details.data.items[0].contentDetails.itemCount
        };
    }
}

// Function to get Videos Id
module.exports.getVideosId = async function getVideosId(params){
    let videosId = [];
    let videoDetails = await youtube.playlistItems.list({
        key : process.env.Google_API_Key, // Your Google API Key
        part : 'contentDetails',
        playlistId : params.playlistId,
        maxResults : 50,
        pageToken : params.nextPageToken
    });
    for(detail of videoDetails.data.items){
        videosId.push(detail.contentDetails.videoId);
    }
    if(videoDetails.data.nextPageToken){
        params.nextPageToken = videoDetails.data.nextPageToken;
        let moreIds = await getVideosId(params);
        videosId = [...videosId, ...moreIds];
    }
    return videosId;
}

// Function to get Videos Details
module.exports.getVideosDetails = async function getVideosDetails(videosId){
    ids = videosId.splice(0, 50);
    let videosDetails = [];
    let videosData = await youtube.videos.list({
        key : process.env.Google_API_Key, // Your Google API Key
        part : 'contentDetails, snippet',
        id : ids.toString()
    });
    for(videoDetails of videosData.data.items){
        let videoLength = videoDetails.contentDetails.duration;
        let data = {
            videoId : videoDetails.id,
            videoURL : "https://www.youtube.com/watch?v=" + videoDetails.id,
            videoTitle : videoDetails.snippet.title,
            videoDescription : videoDetails.snippet.description,
            videoThumbnail : videoDetails.snippet.thumbnails.medium.url,
            videoLength : videoLength.slice(2, videoLength.length - 1).replace(/M/i, ":")
        }
        videosDetails.push(data);
    }
    if(videosId.length > 0){
        videosId = videosId;
        let moreData = await getVideosDetails(videosId);
        videosDetails = [...videosDetails, ...moreData];
    }
    return videosDetails;
}