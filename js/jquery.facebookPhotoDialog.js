/**
 * @projectDescription Load User Facebook Albums and Images with jQuery
 *
 * @version 2.0
 * @author David Brukarz
 * @author Darius Daftary
 *	
 * Date : 10/5/2012
 *
 * Released under the MIT licence:
 * http://www.opensource.org/licenses/mit-license.php
 */


 (function($) {
 	$.widget('ui.facebookPhotoDialog', $.ui.dialog, {
 		albumsData: undefined,
 		photosData: undefined,
 		defaultButtons: undefined,
 		options: {
 			albumsLoadingLabel:'Albums Loading',
 			imagesLoadingLabel:'Images Loading',
 			needAuthorizeLabel:"You must authorize the application",
 			loadingImage:'images/loading.gif',
 			urlFacebookScript:'http://connect.facebook.net/en_US/all.js',
 			appId:null
 		},
 		_create: function() {
 			console.log('create');
 			if(this.options.appId === null){
 				$(this).html("The AppId is not set, try this code : $('#reference').facebookPhotoDialog({appId:'YOUR-APP-ID'})");
 				return;
 			}
 			return $.ui.dialog.prototype._create.apply(this, arguments);
 		},
 		_init: function(){
 			console.log('init');
 			this.defaultButtons = this.options.buttons;
 			return $.ui.dialog.prototype._init.apply(this, arguments);
 		},
 		open: function() {
 			this._restoreDefaultButtons();
 			var self = this;
 			$.getScript(this.options.urlFacebookScript, function() {
 				$('body').prepend('<div id="fb-root"></div>');
 				self.element.html('<div id="fbListAlbumsContainer"></div><div id="fbImagesContainer"></div>');
 				//console.log(_this);
 				self._login();
 			});
 			return $.ui.dialog.prototype.open.apply(this, arguments);
 		},
 		_showLoader: function() {
 			$('#fbListAlbumsContainer').hide();
 			this.element.css({
 				background:'url(' + this.options.loadingImage + ') center no-repeat'
 			});
 		},
 		_hideLoader: function() {
 			$('#fbListAlbumsContainer').show();
 			this.element.css({
 				background:'none'
 			});
 		},
 		_login: function(){
 			var _options = this.options;
 			this._showLoader();
 			FB.init({
 				appId: _options.appId,
 				cookie : true,
 				status: true
 			});

 			var self = this;
 			FB.login(function(response) {
 				if(response.status == "connected"){//response.scope && response.scope.indexOf('user_photos') != -1){
 					self._getAlbums();
 				}else{
 					$('#fbListAlbumsContainer').html(_options.needAuthorizeLabel);
 				}
 			},{scope: 'user_photos'});
 		},
 		_getAlbums: function(){
 			var self=this;
 			$(document).bind('whatever', function (e){
 				self.someCallback(this, e);
 			});
 			var someCallback=function(source,event){
 				//do stuff
 			};
 			var self = this;
 			FB.api('/me/albums', function (response){
 				self._onAlbumsGot(response);
 			});
 		},
 		_onAlbumsGot: function(response){
 			this._hideLoader();
 			var data = response.data;
 			var counter = 0;
 			var contentHTML = '';
 			this.albumsData = data;
 			for (var i = 0; i < data.length; i++){
 				var album = data[i];
 				if(album.count > 0) {
 					contentHTML += '<div class="fbAlbum" id="album_'+counter+'"><div class="album_cover"></div><p>' + album.name + ' (' + album.count + ')</p></div>';
 					var cover_id = album.cover_photo;
 					(function(index, cover_id) {
 						FB.api('/' + cover_id, function(coverData) {
 							$('.album_cover', '#album_' + index).css({
 								background:'url(' + coverData.picture + ') center no-repeat'
 							});
 						});
 					})(counter, cover_id);
 				}

 				counter++;
 			}
 			$('#fbListAlbumsContainer')
 				.html(contentHTML)
 				.find('.album_cover')
 				.css({
 					background:'url(' + this.options.loadingImage + ') center no-repeat'
 				});
 			var self = this;
 			$('.fbAlbum').click(function() {
 				self._onFBAlbumSelected($(this).attr('id').replace('album_',''));
 			});

 		},
 		_onFBAlbumSelected: function (index){
 			this._showLoader();
 			var aid = this.albumsData[index].id;
 			var self = this;
 			FB.api(aid + '/photos',
 				function(data) {
 					self._onPhotosGot(data)
 				}
 			);
 			this._addBackButton();
 		},
 		_addBackButton: function() {
 			var buttons = this.options.buttons;
 			var self = this;
 			var newButtons = {
 				Back: function() { 
 					$('#fbImagesContainer').hide();
 					self._restoreDefaultButtons();
 				}
 			};
 			$.extend(newButtons, buttons);
 			this.element.facebookPhotoDialog( "option", "buttons", newButtons);
 		},
 		_restoreDefaultButtons: function() {
 			this.element.facebookPhotoDialog( "option", "buttons", this.defaultButtons);
 		},
 		_onPhotosGot: function(response){
 			this._hideLoader();
 			var data = response.data;
 			var counter = 0;
 			var contentHTML = '';
 			this.photosData = data;
 			for (var i = 0; i < data.length; i++){
 				contentHTML += '<div class="fbBlock" id="image_'+counter+'"><img src="' + data[i].picture + '"/></div>';
 				counter++;
 			}
 			$('#fbImagesContainer').html(contentHTML).show();
 			var self = this;
 			$('.fbBlock').click(function(e) {
 				self._onFBPhotoSelected(e, $(this).addClass('selected').attr('id').replace('image_',''));
 			});
 		},
 		_onFBPhotoSelected: function (e, index){
 			this._trigger('photoselected', e, this.photosData[index]);
 		}
 	});
 })(jQuery);
