/**
 * @projectDescription Load User Facebook Albums and Images with jQuery
 *
 * @version 1.0
 * @author David Brukarz
 *	
 * Example on http://www.davel.fr/demo/facebook/getFacebookAlbums.html
 * Details, in french, at http://www.davel.fr/techblog/2010/06/plugin-jquery-get-facebook-albums-photos
 * Date : 17/06/2010
 * Copyright ©2010 David Brukarz <http://davel.fr/>
 *
 * Released under the MIT licence:
 * http://www.opensource.org/licenses/mit-license.php
 */


(function($) {
	$.widget('ui.facebookPhotoDialog', $.ui.dialog, {
		albumsData: undefined,
		photosData: undefined,
		selectedPhoto: undefined,
		defaultButtons: undefined,
		_this: undefined,
		options: {
			albumsLoadingLabel:'Albums Loading',
			imagesLoadingLabel:'Images Loading',
			needAuthorizeLabel:"You must authorize the application",
			loadingImage:'images/loading.gif',
			urlFacebookScript:'http://connect.facebook.net/en_US/all.js',
			onImageSelected:null,
			appId:null
		},
		_super_create: $.ui.dialog.prototype._create,
		_create: function() {
			_this = this;
			$.ui.dialog.prototype._create.apply(this, arguments);
			if(this.options.appId === null){
				$(this).html("The AppId is not set, try this code : $('#reference').facebookPhotoDialog({appId:'YOUR-APP-ID'})");
				return;
			}
		},
		_init: function(){
			_this.defaultButtons = this.options.buttons;
			return $.ui.dialog.prototype._init.apply(this, arguments);
		},
		open: function() {
			this._restoreDefaultButtons();
			$.ui.dialog.prototype.open.apply(this, arguments);
			$.getScript(this.options.urlFacebookScript, function() {
				$('body').prepend('<div id="fb-root"></div>');
				_this.element.html('<div id="fbListAlbumsContainer"></div><div id="fbImagesContainer"></div>');
				_this._login();
			});
		},
		_showLoader: function() {
			$('#fbListAlbumsContainer').hide();
			_this.element.css({
				background:'url(' + _this.options.loadingImage + ') center no-repeat'
			});
		},
		_hideLoader: function() {
			$('#fbListAlbumsContainer').show();
			_this.element.css({
				background:'none'
			});
		},
		_login: function(){
			var _options = this.options;
			_this._showLoader();
			FB.init({
				appId: _options.appId,
				cookie : true,
				status: true
			});

			FB.login(function(response) {
				if(response.status == "connected"){//response.scope && response.scope.indexOf('user_photos') != -1){
					_this._getAlbums();
				}else{
					$('#fbListAlbumsContainer').html(_options.needAuthorizeLabel);
				}
			},{scope: 'user_photos'});
		},
		_getAlbums: function(){
			FB.api('/me/albums',
				_this._onAlbumsGot
			);
		},
		_onAlbumsGot: function(response){
			_this._hideLoader();
			var data = response.data;
			var counter = 0;
			var contentHTML = '';
			_this.albumsData = data;
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
					background:'url(' + _this.options.loadingImage + ') center no-repeat'
				});

			$('.fbAlbum').click(_this._onFBAlbumSelected);
			
		},
		_onFBAlbumSelected: function (){
			_this._showLoader();
			var aid = _this.albumsData[$(this).attr('id').replace('album_','')].id;
			FB.api(aid + '/photos',
				_this._onPhotosGot
			);
			_this._addBackButton();
		},
		_addBackButton: function() {
			var buttons = _this.options.buttons;
			var newButtons = {
				Back: function() { 
					$('#fbImagesContainer').hide();
					_this._restoreDefaultButtons();
				}
			};
			$.extend(newButtons, buttons);
			_this.element.facebookPhotoDialog( "option", "buttons", newButtons);
		},
		_restoreDefaultButtons: function() {
			console.log(_this.defaultButtons);
			_this.element.facebookPhotoDialog( "option", "buttons", _this.defaultButtons);
		},
		_onPhotosGot: function(response){
			_this._hideLoader();
			var data = response.data;
			var counter = 0;
			var contentHTML = '';
			_this.photosData = data;
			for (var i = 0; i < data.length; i++){
				contentHTML += '<div class="fbBlock" id="image_'+counter+'"><img src="' + data[i].picture + '"/></div>';
				counter++;
			}
			$('#fbImagesContainer').html(contentHTML).show();
			$('.fbBlock').click(_this._onFBPhotoSelected);
		},
		_onFBPhotoSelected: function (){
			_this.selectedPhoto = $(this).addClass('selected').attr('id').replace('image_','');
			_this.element.trigger('photoSelected', _this.photosData[_this.selectedPhoto]);
		}
	});
})(jQuery);
