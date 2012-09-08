from django.utils import simplejson
from django.shortcuts import render_to_response
from django.http import HttpResponse, HttpResponseRedirect

from json import loads
from simplerouting.src import simple_routing

def home(request):
    template_name = 'base.html'
    router = simple_routing.Router()
    router.load_graph()

    lista_paradas = []

    for stop_id in router.graph.get_stops():
        stop = router.graph.get_stop(stop_id)
        lista_paradas.append({
            "stop_id": stop.stop_id,
            "lat": stop.lat,
            "lon": stop.lon
            })
    geodata = simplejson.dumps(lista_paradas)
    template_fields = {'geodata': geodata}
    return render_to_response(template_name, template_fields)

def get_route(request):
    router = simple_routing.Router()
    router.load_graph()

    results = {'success': "Error"}
    if request.method == u'GET':
        origin = request.GET[u'origin']
        destination = request.GET[u'destination']
        results = {'success': "me pides ir desde %s hasta %s" % (origin, destination)}
        try:
            path, dist = router.run(origin, destination)
        except Exception as ex:
            results = {'success': str(ex)}

    results['request'] = [origin, destination]
    results['distance'] = dist
    results['stop_list'] = path

    json = simplejson.dumps(results)
    return HttpResponse(json, mimetype='application/json')
