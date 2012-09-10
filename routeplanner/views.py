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
    origin = request.GET[u'origin']
    destination = request.GET[u'destination']

    response = {}
    response['request'] = [origin, destination]
    try:
        router = simple_routing.Router()
        router.load_graph()
        path, dist = router.run(origin, destination)
        response['result_code'] = 0
        response['response'] = {'path': path,
                                'distance': dist}
    except Exception as ex:
        response['result_code'] = 1
        response['result_msg'] = "An error ocurred calculating your trip."

    return HttpResponse(simplejson.dumps(response),
                        mimetype='application/json')
