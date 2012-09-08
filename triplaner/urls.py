from django.conf.urls import patterns, include, url

urlpatterns = patterns('',
    url(r'^$', 'routeplanner.views.home', name='home'),
    url(r'^route/$', 'routeplanner.views.get_route', name='route'),
)
